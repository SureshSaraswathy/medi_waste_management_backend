import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.domain.entity';
import { CreateCompleteUserDto } from '../dto/create-complete-user.dto';
import { randomUUID } from 'crypto';
import { DuplicateMobileNumberException } from '../../domain/exceptions/user.exceptions';
import { UserEmployeeProfileEntity } from '../../infrastructure/persistence/user-employee-profile.entity';
import { UserIdentityComplianceEntity } from '../../infrastructure/persistence/user-identity-compliance.entity';
import { UserAddressEntity } from '../../infrastructure/persistence/user-address.entity';
import { UserEntity } from '../../infrastructure/persistence/user.entity';

@Injectable()
export class CreateCompleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @InjectDataSource('master')
    private readonly dataSource: DataSource,
  ) {}

  async execute(createCompleteUserDto: CreateCompleteUserDto, createdBy?: string): Promise<User> {
    console.log('========== CreateCompleteUserUseCase.execute START ==========');
    console.log('Full DTO received:', JSON.stringify(createCompleteUserDto, null, 2));
    console.log('Email Address:', createCompleteUserDto.emailAddress);
    console.log('Aadhaar:', createCompleteUserDto.aadhaarNumber);
    console.log('PAN:', createCompleteUserDto.panNumber);
    console.log('ESI:', createCompleteUserDto.esiNumber);
    console.log('Address Line:', createCompleteUserDto.addressLine);
    console.log('Area:', createCompleteUserDto.area);
    console.log('City:', createCompleteUserDto.city);
    
    // Check for duplicate mobile number per company
    const existing = await this.userRepository.findByMobile(
      createCompleteUserDto.companyId,
      createCompleteUserDto.mobileNumber,
    );
    if (existing) {
      throw new DuplicateMobileNumberException(
        createCompleteUserDto.mobileNumber,
        createCompleteUserDto.companyId,
      );
    }

    // Use transaction to ensure all related data is saved atomically
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Create User (Identity Only)
      const userId = randomUUID();
      const user = User.create({
        userId,
        companyId: createCompleteUserDto.companyId,
        userName: createCompleteUserDto.userName,
        mobileNumber: createCompleteUserDto.mobileNumber,
        employeeCode: createCompleteUserDto.employeeCode,
        userRoleId: createCompleteUserDto.userRoleId,
        createdBy: createdBy || null,
      });

      // Set activation fields if provided
      if (createCompleteUserDto.status) {
        user.status = createCompleteUserDto.status as any;
      }
      if (createCompleteUserDto.webLogin !== undefined) {
        user.webLogin = createCompleteUserDto.webLogin;
      }
      if (createCompleteUserDto.mobileAppAccess !== undefined) {
        user.mobileAppAccess = createCompleteUserDto.mobileAppAccess;
      }
      if (createCompleteUserDto.passwordEnabled !== undefined) {
        user.passwordEnabled = createCompleteUserDto.passwordEnabled;
      }
      if (createCompleteUserDto.otpEnabled !== undefined) {
        user.otpEnabled = createCompleteUserDto.otpEnabled;
      }
      if (createCompleteUserDto.forceOtpOnNextLogin !== undefined) {
        user.forceOtpOnNextLogin = createCompleteUserDto.forceOtpOnNextLogin;
      }

      // Save user using query runner to be part of transaction
      const userEntity = queryRunner.manager.create(UserEntity, {
        userId: user.userId,
        companyId: user.companyId,
        userName: user.userName,
        mobileNumber: user.mobileNumber,
        employeeCode: user.employeeCode,
        userRoleId: user.userRoleId,
        status: user.status,
        passwordEnabled: user.passwordEnabled,
        otpEnabled: user.otpEnabled,
        forceOtpOnNextLogin: user.forceOtpOnNextLogin,
        webLogin: user.webLogin,
        mobileAppAccess: user.mobileAppAccess,
        createdBy: user.createdBy,
        createdOn: user.createdOn,
        modifiedBy: user.modifiedBy,
        modifiedOn: user.modifiedOn,
        isDeleted: user.isDeleted,
      });
      const savedUserEntity = await queryRunner.manager.save(UserEntity, userEntity);
      const savedUser = user; // Use the domain entity we already created

      // Step 2: Create Employee Profile (always create, even if empty)
      const emailValue = createCompleteUserDto.emailAddress && createCompleteUserDto.emailAddress.trim() 
        ? createCompleteUserDto.emailAddress.trim() 
        : null;
      
      console.log('Step 2 - Creating Employee Profile:');
      console.log('  Email Address:', emailValue);
      console.log('  Employment Type:', createCompleteUserDto.employmentType);
      console.log('  Designation:', createCompleteUserDto.designation);
      
      const employeeProfile = queryRunner.manager.create(UserEmployeeProfileEntity, {
        userId: savedUser.userId,
        employmentType: createCompleteUserDto.employmentType || null,
        designation: createCompleteUserDto.designation || null,
        contractorName: createCompleteUserDto.contractorName || null,
        companyNameThirdParty: createCompleteUserDto.companyNameThirdParty || null,
        grossSalary: createCompleteUserDto.grossSalary || null,
        emailAddress: emailValue,
        createdBy: createdBy || null,
      });
      
      console.log('Step 2 - Employee Profile entity created:', JSON.stringify(employeeProfile, null, 2));
      const savedEmployeeProfile = await queryRunner.manager.save(UserEmployeeProfileEntity, employeeProfile);
      console.log('Step 2 - Employee Profile saved with ID:', savedEmployeeProfile.userId);

      // Step 3: Create Identity & Compliance (always create, even if empty)
      const aadhaarValue = createCompleteUserDto.aadhaarNumber && createCompleteUserDto.aadhaarNumber.trim() 
        ? createCompleteUserDto.aadhaarNumber.trim() 
        : null;
      const panValue = createCompleteUserDto.panNumber && createCompleteUserDto.panNumber.trim() 
        ? createCompleteUserDto.panNumber.trim() 
        : null;
      const esiValue = createCompleteUserDto.esiNumber && createCompleteUserDto.esiNumber.trim() 
        ? createCompleteUserDto.esiNumber.trim() 
        : null;
      
      console.log('Step 3 - Creating Identity & Compliance:');
      console.log('  Aadhaar:', aadhaarValue);
      console.log('  PAN:', panValue);
      console.log('  ESI:', esiValue);
      console.log('  Driving License:', createCompleteUserDto.drivingLicenseNumber);
      console.log('  PF Number:', createCompleteUserDto.pfNumber);
      console.log('  UAN:', createCompleteUserDto.uanNumber);
      
      const identityCompliance = queryRunner.manager.create(UserIdentityComplianceEntity, {
        userId: savedUser.userId,
        aadhaarNumber: aadhaarValue,
        panNumber: panValue,
        drivingLicenseNumber: createCompleteUserDto.drivingLicenseNumber && createCompleteUserDto.drivingLicenseNumber.trim() 
          ? createCompleteUserDto.drivingLicenseNumber.trim() 
          : null,
        pfNumber: createCompleteUserDto.pfNumber && createCompleteUserDto.pfNumber.trim() 
          ? createCompleteUserDto.pfNumber.trim() 
          : null,
        uanNumber: createCompleteUserDto.uanNumber && createCompleteUserDto.uanNumber.trim() 
          ? createCompleteUserDto.uanNumber.trim() 
          : null,
        esiNumber: esiValue,
        createdBy: createdBy || null,
      });
      
      console.log('Step 3 - Identity & Compliance entity created:', JSON.stringify(identityCompliance, null, 2));
      const savedIdentityCompliance = await queryRunner.manager.save(UserIdentityComplianceEntity, identityCompliance);
      console.log('Step 3 - Identity & Compliance saved with ID:', savedIdentityCompliance.userId);

      // Step 4: Create Address & Emergency (always create, even if empty)
      const addressLineValue = createCompleteUserDto.addressLine && createCompleteUserDto.addressLine.trim() 
        ? createCompleteUserDto.addressLine.trim() 
        : null;
      const areaValue = createCompleteUserDto.area && createCompleteUserDto.area.trim() 
        ? createCompleteUserDto.area.trim() 
        : null;
      const cityValue = createCompleteUserDto.city && createCompleteUserDto.city.trim() 
        ? createCompleteUserDto.city.trim() 
        : null;
      
      console.log('Step 4 - Creating Address & Emergency:');
      console.log('  Address Line:', addressLineValue);
      console.log('  Area:', areaValue);
      console.log('  City:', cityValue);
      console.log('  District:', createCompleteUserDto.district);
      console.log('  Pincode:', createCompleteUserDto.pincode);
      console.log('  Emergency Contact:', createCompleteUserDto.emergencyContact);
      
      const address = queryRunner.manager.create(UserAddressEntity, {
        userId: savedUser.userId,
        addressLine: addressLineValue,
        area: areaValue,
        city: cityValue,
        district: createCompleteUserDto.district && createCompleteUserDto.district.trim() 
          ? createCompleteUserDto.district.trim() 
          : null,
        pincode: createCompleteUserDto.pincode && createCompleteUserDto.pincode.trim() 
          ? createCompleteUserDto.pincode.trim() 
          : null,
        emergencyContact: createCompleteUserDto.emergencyContact && createCompleteUserDto.emergencyContact.trim() 
          ? createCompleteUserDto.emergencyContact.trim() 
          : null,
        createdBy: createdBy || null,
      });
      
      console.log('Step 4 - Address entity created:', JSON.stringify(address, null, 2));
      const savedAddress = await queryRunner.manager.save(UserAddressEntity, address);
      console.log('Step 4 - Address saved with ID:', savedAddress.userId);

      // Commit transaction
      console.log('========== Committing Transaction ==========');
      await queryRunner.commitTransaction();
      console.log('✅ Transaction committed successfully. User ID:', savedUser.userId);
      console.log('========== CreateCompleteUserUseCase.execute END ==========');

      return savedUser;
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      console.error('Error in CreateCompleteUserUseCase - Transaction rolled back:', error);
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}
