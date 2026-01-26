import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.domain.entity';
import { UserNotFoundException } from '../../domain/exceptions/user.exceptions';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../infrastructure/persistence/user.entity';
import { UserEmployeeProfileEntity } from '../../infrastructure/persistence/user-employee-profile.entity';
import { UserIdentityComplianceEntity } from '../../infrastructure/persistence/user-identity-compliance.entity';
import { UserAddressEntity } from '../../infrastructure/persistence/user-address.entity';

/**
 * Use Case: Get User by UserName
 * Searches across all companies to find a user by userName
 */
@Injectable()
export class GetUserByUsernameUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @InjectDataSource('master')
    private readonly dataSource: DataSource,
  ) {}

  async execute(userName: string): Promise<any> {
    // Search for user by userName across all companies
    // We need to query the database directly since repository method requires companyId
    const userEntity = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .where('user.userName = :userName', { userName })
      .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!userEntity) {
      throw new UserNotFoundException(`User with userName "${userName}" not found`);
    }

    // Fetch related data
    const employeeProfile = await this.dataSource
      .getRepository(UserEmployeeProfileEntity)
      .findOne({
        where: { userId: userEntity.userId, isDeleted: false },
      });

    const identityCompliance = await this.dataSource
      .getRepository(UserIdentityComplianceEntity)
      .findOne({
        where: { userId: userEntity.userId, isDeleted: false },
      });

    const address = await this.dataSource
      .getRepository(UserAddressEntity)
      .findOne({
        where: { userId: userEntity.userId, isDeleted: false },
      });

    return {
      userId: userEntity.userId,
      companyId: userEntity.companyId,
      userName: userEntity.userName,
      mobileNumber: userEntity.mobileNumber,
      employeeCode: userEntity.employeeCode,
      userRoleId: userEntity.userRoleId,
      status: userEntity.status,
      passwordEnabled: userEntity.passwordEnabled,
      otpEnabled: userEntity.otpEnabled,
      webLogin: userEntity.webLogin,
      mobileAppAccess: userEntity.mobileAppAccess,
      // Employee Profile data
      emailAddress: employeeProfile?.emailAddress || null,
      employmentType: employeeProfile?.employmentType || null,
      designation: employeeProfile?.designation || null,
      contractorName: employeeProfile?.contractorName || null,
      companyNameThirdParty: employeeProfile?.companyNameThirdParty || null,
      grossSalary: employeeProfile?.grossSalary ? Number(employeeProfile.grossSalary) : null,
      // Identity & Compliance data
      aadhaarNumber: identityCompliance?.aadhaarNumber || null,
      panNumber: identityCompliance?.panNumber || null,
      drivingLicenseNumber: identityCompliance?.drivingLicenseNumber || null,
      pfNumber: identityCompliance?.pfNumber || null,
      uanNumber: identityCompliance?.uanNumber || null,
      esiNumber: identityCompliance?.esiNumber || null,
      // Address data
      addressLine: address?.addressLine || null,
      area: address?.area || null,
      city: address?.city || null,
      district: address?.district || null,
      pincode: address?.pincode || null,
      emergencyContact: address?.emergencyContact || null,
      createdOn: userEntity.createdOn,
      modifiedOn: userEntity.modifiedOn,
    };
  }
}
