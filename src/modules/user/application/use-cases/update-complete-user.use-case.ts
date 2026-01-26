import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.domain.entity';
import { UpdateCompleteUserDto } from '../dto/update-complete-user.dto';
import { UserNotFoundException } from '../../domain/exceptions/user.exceptions';
import { UserEmployeeProfileEntity } from '../../infrastructure/persistence/user-employee-profile.entity';
import { UserIdentityComplianceEntity } from '../../infrastructure/persistence/user-identity-compliance.entity';
import { UserAddressEntity } from '../../infrastructure/persistence/user-address.entity';

@Injectable()
export class UpdateCompleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @InjectDataSource('master')
    private readonly dataSource: DataSource,
  ) {}

  async execute(userId: string, updateCompleteUserDto: UpdateCompleteUserDto, modifiedBy?: string): Promise<User> {
    console.log('========== UpdateCompleteUserUseCase.execute START ==========');
    console.log('User ID:', userId);
    console.log('Full DTO received:', JSON.stringify(updateCompleteUserDto, null, 2));
    console.log('Email Address:', updateCompleteUserDto.emailAddress);
    console.log('Aadhaar:', updateCompleteUserDto.aadhaarNumber);
    console.log('PAN:', updateCompleteUserDto.panNumber);
    console.log('ESI:', updateCompleteUserDto.esiNumber);
    console.log('Address Line:', updateCompleteUserDto.addressLine);

    // Get existing user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Use transaction to ensure all related data is updated atomically
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Update User (Identity Only)
      if (updateCompleteUserDto.userName) {
        user.update({ userName: updateCompleteUserDto.userName }, modifiedBy);
      }
      if (updateCompleteUserDto.mobileNumber) {
        user.update({ mobileNumber: updateCompleteUserDto.mobileNumber }, modifiedBy);
      }
      if (updateCompleteUserDto.employeeCode !== undefined) {
        user.update({ employeeCode: updateCompleteUserDto.employeeCode }, modifiedBy);
      }
      if (updateCompleteUserDto.userRoleId !== undefined) {
        user.update({ userRoleId: updateCompleteUserDto.userRoleId }, modifiedBy);
      }

      // Update activation fields if provided
      if (updateCompleteUserDto.status) {
        user.status = updateCompleteUserDto.status as any;
        user.modifiedBy = modifiedBy || null;
        user.modifiedOn = new Date();
      }
      if (updateCompleteUserDto.webLogin !== undefined) {
        user.webLogin = updateCompleteUserDto.webLogin;
        user.modifiedBy = modifiedBy || null;
        user.modifiedOn = new Date();
      }
      if (updateCompleteUserDto.mobileAppAccess !== undefined) {
        user.mobileAppAccess = updateCompleteUserDto.mobileAppAccess;
        user.modifiedBy = modifiedBy || null;
        user.modifiedOn = new Date();
      }
      if (updateCompleteUserDto.passwordEnabled !== undefined) {
        user.passwordEnabled = updateCompleteUserDto.passwordEnabled;
        user.modifiedBy = modifiedBy || null;
        user.modifiedOn = new Date();
      }
      if (updateCompleteUserDto.otpEnabled !== undefined) {
        user.otpEnabled = updateCompleteUserDto.otpEnabled;
        user.modifiedBy = modifiedBy || null;
        user.modifiedOn = new Date();
      }
      if (updateCompleteUserDto.forceOtpOnNextLogin !== undefined) {
        user.forceOtpOnNextLogin = updateCompleteUserDto.forceOtpOnNextLogin;
        user.modifiedBy = modifiedBy || null;
        user.modifiedOn = new Date();
      }

      // Save user using query runner to be part of transaction
      await this.userRepository.update(userId, user);

      // Step 2: Update Employee Profile (upsert - update if exists, create if not)
      const emailValue = updateCompleteUserDto.emailAddress && updateCompleteUserDto.emailAddress.trim() 
        ? updateCompleteUserDto.emailAddress.trim() 
        : null;

      console.log('Step 2 - Updating Employee Profile:');
      console.log('  Email Address:', emailValue);
      console.log('  Employment Type:', updateCompleteUserDto.employmentType);
      console.log('  Designation:', updateCompleteUserDto.designation);

      let employeeProfile = await queryRunner.manager.findOne(UserEmployeeProfileEntity, {
        where: { userId, isDeleted: false },
      });

      if (employeeProfile) {
        // Update existing
        employeeProfile.employmentType = updateCompleteUserDto.employmentType || employeeProfile.employmentType;
        employeeProfile.designation = updateCompleteUserDto.designation || employeeProfile.designation;
        employeeProfile.contractorName = updateCompleteUserDto.contractorName !== undefined 
          ? (updateCompleteUserDto.contractorName && updateCompleteUserDto.contractorName.trim() ? updateCompleteUserDto.contractorName.trim() : null)
          : employeeProfile.contractorName;
        employeeProfile.companyNameThirdParty = updateCompleteUserDto.companyNameThirdParty !== undefined
          ? (updateCompleteUserDto.companyNameThirdParty && updateCompleteUserDto.companyNameThirdParty.trim() ? updateCompleteUserDto.companyNameThirdParty.trim() : null)
          : employeeProfile.companyNameThirdParty;
        employeeProfile.grossSalary = updateCompleteUserDto.grossSalary !== undefined ? updateCompleteUserDto.grossSalary : employeeProfile.grossSalary;
        employeeProfile.emailAddress = emailValue !== undefined ? emailValue : employeeProfile.emailAddress;
        employeeProfile.modifiedBy = modifiedBy || null;
        employeeProfile.modifiedOn = new Date();
        await queryRunner.manager.save(UserEmployeeProfileEntity, employeeProfile);
        console.log('Step 2 - Employee Profile UPDATED');
      } else {
        // Create new
        employeeProfile = queryRunner.manager.create(UserEmployeeProfileEntity, {
          userId,
          employmentType: updateCompleteUserDto.employmentType || null,
          designation: updateCompleteUserDto.designation || null,
          contractorName: updateCompleteUserDto.contractorName && updateCompleteUserDto.contractorName.trim() ? updateCompleteUserDto.contractorName.trim() : null,
          companyNameThirdParty: updateCompleteUserDto.companyNameThirdParty && updateCompleteUserDto.companyNameThirdParty.trim() ? updateCompleteUserDto.companyNameThirdParty.trim() : null,
          grossSalary: updateCompleteUserDto.grossSalary || null,
          emailAddress: emailValue,
          createdBy: modifiedBy || null,
        });
        await queryRunner.manager.save(UserEmployeeProfileEntity, employeeProfile);
        console.log('Step 2 - Employee Profile CREATED');
      }

      // Step 3: Update Identity & Compliance (upsert)
      const aadhaarValue = updateCompleteUserDto.aadhaarNumber && updateCompleteUserDto.aadhaarNumber.trim() 
        ? updateCompleteUserDto.aadhaarNumber.trim() 
        : null;
      const panValue = updateCompleteUserDto.panNumber && updateCompleteUserDto.panNumber.trim() 
        ? updateCompleteUserDto.panNumber.trim() 
        : null;
      const esiValue = updateCompleteUserDto.esiNumber && updateCompleteUserDto.esiNumber.trim() 
        ? updateCompleteUserDto.esiNumber.trim() 
        : null;

      console.log('Step 3 - Updating Identity & Compliance:');
      console.log('  Aadhaar:', aadhaarValue);
      console.log('  PAN:', panValue);
      console.log('  ESI:', esiValue);

      let identityCompliance = await queryRunner.manager.findOne(UserIdentityComplianceEntity, {
        where: { userId, isDeleted: false },
      });

      if (identityCompliance) {
        // Update existing
        identityCompliance.aadhaarNumber = aadhaarValue !== undefined ? aadhaarValue : identityCompliance.aadhaarNumber;
        identityCompliance.panNumber = panValue !== undefined ? panValue : identityCompliance.panNumber;
        identityCompliance.drivingLicenseNumber = updateCompleteUserDto.drivingLicenseNumber !== undefined
          ? (updateCompleteUserDto.drivingLicenseNumber && updateCompleteUserDto.drivingLicenseNumber.trim() ? updateCompleteUserDto.drivingLicenseNumber.trim() : null)
          : identityCompliance.drivingLicenseNumber;
        identityCompliance.pfNumber = updateCompleteUserDto.pfNumber !== undefined
          ? (updateCompleteUserDto.pfNumber && updateCompleteUserDto.pfNumber.trim() ? updateCompleteUserDto.pfNumber.trim() : null)
          : identityCompliance.pfNumber;
        identityCompliance.uanNumber = updateCompleteUserDto.uanNumber !== undefined
          ? (updateCompleteUserDto.uanNumber && updateCompleteUserDto.uanNumber.trim() ? updateCompleteUserDto.uanNumber.trim() : null)
          : identityCompliance.uanNumber;
        identityCompliance.esiNumber = esiValue !== undefined ? esiValue : identityCompliance.esiNumber;
        identityCompliance.modifiedBy = modifiedBy || null;
        identityCompliance.modifiedOn = new Date();
        await queryRunner.manager.save(UserIdentityComplianceEntity, identityCompliance);
        console.log('Step 3 - Identity & Compliance UPDATED');
      } else {
        // Create new
        identityCompliance = queryRunner.manager.create(UserIdentityComplianceEntity, {
          userId,
          aadhaarNumber: aadhaarValue,
          panNumber: panValue,
          drivingLicenseNumber: updateCompleteUserDto.drivingLicenseNumber && updateCompleteUserDto.drivingLicenseNumber.trim() ? updateCompleteUserDto.drivingLicenseNumber.trim() : null,
          pfNumber: updateCompleteUserDto.pfNumber && updateCompleteUserDto.pfNumber.trim() ? updateCompleteUserDto.pfNumber.trim() : null,
          uanNumber: updateCompleteUserDto.uanNumber && updateCompleteUserDto.uanNumber.trim() ? updateCompleteUserDto.uanNumber.trim() : null,
          esiNumber: esiValue,
          createdBy: modifiedBy || null,
        });
        await queryRunner.manager.save(UserIdentityComplianceEntity, identityCompliance);
        console.log('Step 3 - Identity & Compliance CREATED');
      }

      // Step 4: Update Address & Emergency (upsert)
      const addressLineValue = updateCompleteUserDto.addressLine && updateCompleteUserDto.addressLine.trim() 
        ? updateCompleteUserDto.addressLine.trim() 
        : null;
      const areaValue = updateCompleteUserDto.area && updateCompleteUserDto.area.trim() 
        ? updateCompleteUserDto.area.trim() 
        : null;
      const cityValue = updateCompleteUserDto.city && updateCompleteUserDto.city.trim() 
        ? updateCompleteUserDto.city.trim() 
        : null;

      console.log('Step 4 - Updating Address & Emergency:');
      console.log('  Address Line:', addressLineValue);
      console.log('  Area:', areaValue);
      console.log('  City:', cityValue);

      let address = await queryRunner.manager.findOne(UserAddressEntity, {
        where: { userId, isDeleted: false },
      });

      if (address) {
        // Update existing
        address.addressLine = addressLineValue !== undefined ? addressLineValue : address.addressLine;
        address.area = areaValue !== undefined ? areaValue : address.area;
        address.city = cityValue !== undefined ? cityValue : address.city;
        address.district = updateCompleteUserDto.district !== undefined
          ? (updateCompleteUserDto.district && updateCompleteUserDto.district.trim() ? updateCompleteUserDto.district.trim() : null)
          : address.district;
        address.pincode = updateCompleteUserDto.pincode !== undefined
          ? (updateCompleteUserDto.pincode && updateCompleteUserDto.pincode.trim() ? updateCompleteUserDto.pincode.trim() : null)
          : address.pincode;
        address.emergencyContact = updateCompleteUserDto.emergencyContact !== undefined
          ? (updateCompleteUserDto.emergencyContact && updateCompleteUserDto.emergencyContact.trim() ? updateCompleteUserDto.emergencyContact.trim() : null)
          : address.emergencyContact;
        address.modifiedBy = modifiedBy || null;
        address.modifiedOn = new Date();
        await queryRunner.manager.save(UserAddressEntity, address);
        console.log('Step 4 - Address UPDATED');
      } else {
        // Create new
        address = queryRunner.manager.create(UserAddressEntity, {
          userId,
          addressLine: addressLineValue,
          area: areaValue,
          city: cityValue,
          district: updateCompleteUserDto.district && updateCompleteUserDto.district.trim() ? updateCompleteUserDto.district.trim() : null,
          pincode: updateCompleteUserDto.pincode && updateCompleteUserDto.pincode.trim() ? updateCompleteUserDto.pincode.trim() : null,
          emergencyContact: updateCompleteUserDto.emergencyContact && updateCompleteUserDto.emergencyContact.trim() ? updateCompleteUserDto.emergencyContact.trim() : null,
          createdBy: modifiedBy || null,
        });
        await queryRunner.manager.save(UserAddressEntity, address);
        console.log('Step 4 - Address CREATED');
      }

      // Commit transaction
      console.log('========== Committing Transaction ==========');
      await queryRunner.commitTransaction();
      console.log('✅ Transaction committed successfully. User ID:', userId);
      console.log('========== UpdateCompleteUserUseCase.execute END ==========');

      return user;
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      console.error('❌ Error in UpdateCompleteUserUseCase - Transaction rolled back:', error);
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}
