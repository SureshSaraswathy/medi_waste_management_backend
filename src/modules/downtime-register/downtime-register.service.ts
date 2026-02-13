import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DowntimeRegisterRepository } from './infrastructure/persistence/downtime-register.repository';
import { CreateDowntimeRegisterDto } from './application/dto/create-downtime-register.dto';
import { UpdateDowntimeRegisterDto } from './application/dto/update-downtime-register.dto';
import { DowntimeRegisterEntity } from './infrastructure/transaction/downtime-register.entity';
import { NotificationHelperService } from '../notification/notification-helper.service';
import { NotificationType } from '../notification/infrastructure/persistence/notification.entity';
import { NotificationPriority } from '../notification/infrastructure/persistence/notification-receiver.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DowntimeRegisterService {
  constructor(
    private readonly repository: DowntimeRegisterRepository,
    @Inject(forwardRef(() => NotificationHelperService))
    private readonly notificationHelper: NotificationHelperService,
  ) {}

  async findAll(companyId?: string, status?: string): Promise<DowntimeRegisterEntity[]> {
    if (companyId) {
      return this.repository.findByCompany(companyId);
    }
    if (status) {
      return this.repository.findByStatus(status);
    }
    return this.repository.findAll();
  }

  async findOne(downtimeId: string): Promise<DowntimeRegisterEntity> {
    const downtime = await this.repository.findById(downtimeId);
    if (!downtime) {
      throw new NotFoundException(`Downtime register with ID ${downtimeId} not found`);
    }
    return downtime;
  }

  async create(createDto: CreateDowntimeRegisterDto, userId?: string): Promise<DowntimeRegisterEntity> {
    // Generate downtime register number
    const dtRegNum = await this.generateDtRegNum();

    const downtimeData: Partial<DowntimeRegisterEntity> = {
      id: uuidv4(),
      dtRegNum,
      companyId: createDto.companyId,
      breakdownDate: new Date(createDto.breakdownDate),
      equipmentId: createDto.equipmentId,
      breakdownType: createDto.breakdownType,
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      downtimeHours: createDto.downtimeHours,
      cause: createDto.cause,
      actionTaken: createDto.actionTaken,
      sparesUsed: createDto.sparesUsed,
      complianceStatus: createDto.complianceStatus || 'Compliant',
      status: createDto.status || 'Active',
      createdBy: userId || null,
      modifiedBy: userId || null,
    };

    const savedDowntime = await this.repository.create(downtimeData);

    // Trigger notifications
    await this.triggerDowntimeNotifications(savedDowntime, userId);

    return savedDowntime;
  }

  private async triggerDowntimeNotifications(
    downtime: DowntimeRegisterEntity,
    userId?: string,
  ): Promise<void> {
    try {
      // Machine breakdown created → Notify Supervisor + Manager
      // Note: In production, resolve role names to IDs using RoleRepository
      // For now, using placeholder role IDs - these should be configured
      const supervisorRoleIds: string[] = []; // TODO: Resolve 'Supervisor' role IDs
      const managerRoleIds: string[] = []; // TODO: Resolve 'Manager' role IDs
      const factoryInchargeRoleIds: string[] = []; // TODO: Resolve 'FactoryIncharge' role IDs

      await this.notificationHelper.notifyRoles(
        'Machine Breakdown Reported',
        `Equipment ${downtime.equipmentId} breakdown reported. Register: ${downtime.dtRegNum}`,
        'downtime',
        [...supervisorRoleIds, ...managerRoleIds],
        {
          referenceId: downtime.id,
          type: NotificationType.ALERT,
          priority: NotificationPriority.MEDIUM,
          createdBy: userId,
        },
      );

      // Downtime > 2 hrs → Manager HIGH priority
      if (downtime.downtimeHours > 2) {
        await this.notificationHelper.notifyRoles(
          'Extended Downtime Alert',
          `Downtime exceeded 2 hours: ${downtime.downtimeHours.toFixed(2)} hrs. Equipment: ${downtime.equipmentId}`,
          'downtime',
          managerRoleIds,
          {
            referenceId: downtime.id,
            type: NotificationType.WARNING,
            priority: NotificationPriority.HIGH,
            createdBy: userId,
          },
        );
      }

      // Downtime > 4 hrs → FactoryIncharge CRITICAL
      if (downtime.downtimeHours > 4) {
        await this.notificationHelper.notifyRoles(
          'Critical Downtime Alert',
          `CRITICAL: Downtime exceeded 4 hours: ${downtime.downtimeHours.toFixed(2)} hrs. Equipment: ${downtime.equipmentId}`,
          'downtime',
          factoryInchargeRoleIds,
          {
            referenceId: downtime.id,
            type: NotificationType.ALERT,
            priority: NotificationPriority.CRITICAL,
            createdBy: userId,
          },
        );
      }
    } catch (error) {
      // Log error but don't fail the downtime creation
      console.error('Failed to send downtime notifications:', error);
    }
  }

  async update(downtimeId: string, updateDto: UpdateDowntimeRegisterDto, userId?: string): Promise<DowntimeRegisterEntity> {
    await this.findOne(downtimeId); // Validate existence

    const updateData: Partial<DowntimeRegisterEntity> = {
      modifiedBy: userId || null,
    };

    if (updateDto.breakdownDate) {
      updateData.breakdownDate = new Date(updateDto.breakdownDate);
    }
    if (updateDto.equipmentId !== undefined) {
      updateData.equipmentId = updateDto.equipmentId;
    }
    if (updateDto.breakdownType !== undefined) {
      updateData.breakdownType = updateDto.breakdownType;
    }
    if (updateDto.startTime !== undefined) {
      updateData.startTime = updateDto.startTime;
    }
    if (updateDto.endTime !== undefined) {
      updateData.endTime = updateDto.endTime;
    }
    if (updateDto.downtimeHours !== undefined) {
      updateData.downtimeHours = updateDto.downtimeHours;
    }
    if (updateDto.cause !== undefined) {
      updateData.cause = updateDto.cause;
    }
    if (updateDto.actionTaken !== undefined) {
      updateData.actionTaken = updateDto.actionTaken;
    }
    if (updateDto.sparesUsed !== undefined) {
      updateData.sparesUsed = updateDto.sparesUsed;
    }
    if (updateDto.complianceStatus !== undefined) {
      updateData.complianceStatus = updateDto.complianceStatus;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    return this.repository.update(downtimeId, updateData);
  }

  async remove(downtimeId: string): Promise<void> {
    await this.findOne(downtimeId); // Validate existence
    await this.repository.softDelete(downtimeId);
  }

  private async generateDtRegNum(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DT-${year}-`;
    
    // Find the latest downtime register number for this year
    const downtimes = await this.repository.findAll();
    const yearDowntimes = downtimes.filter(
      (dt) => dt.dtRegNum.startsWith(prefix)
    );
    
    if (yearDowntimes.length === 0) {
      return `${prefix}001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearDowntimes.map((dt) => {
      const seq = dt.dtRegNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextSeq}`;
  }
}
