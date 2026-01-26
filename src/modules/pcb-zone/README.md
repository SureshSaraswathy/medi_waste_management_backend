# PCB Zone Master Module

This module follows the same pattern as State, Area, and Color modules.

## Structure
- Domain: `pcb-zone.domain.entity.ts`, `pcb-zone.repository.interface.ts`, `pcb-zone.exceptions.ts`
- Application: DTOs and Use Cases (Create, Get, GetAll, Update, Delete)
- Infrastructure: `pcb-zone.entity.ts`, `pcb-zone.repository.ts`
- Presentation: `pcb-zone.controller.ts`

## Fields
- pcbZoneId (UUID, PK)
- pcbZoneName (string, unique per company)
- pcbZoneAddress (string)
- contactNum (string)
- contactEmail (string)
- alertEmail (string)
- status (MasterStatus)
- Standard audit fields (createdBy, createdOn, modifiedBy, modifiedOn, isDeleted)

## API Endpoints
- POST /pcb-zones - Create
- GET /pcb-zones - Get all (with optional activeOnly query)
- GET /pcb-zones/:id - Get by ID
- PUT /pcb-zones/:id - Update
- DELETE /pcb-zones/:id - Soft delete

## Permissions Required
- PCB_ZONE_CREATE
- PCB_ZONE_VIEW
- PCB_ZONE_EDIT
- PCB_ZONE_DELETE
