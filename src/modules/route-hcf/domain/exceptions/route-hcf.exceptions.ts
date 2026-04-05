import { NotFoundException, ConflictException } from '@nestjs/common';

export class RouteHcfNotFoundException extends NotFoundException {
  constructor(routeHcfId: string) {
    super(`Route HCF mapping with ID ${routeHcfId} not found`);
  }
}

export class DuplicateRouteHcfMappingException extends ConflictException {
  constructor(routeId: string, hcfId: string) {
    super(`A mapping between this route and HCF already exists. Each route-HCF combination can only be mapped once.`);
  }
}

/** HCF is already linked to a route; each HCF may only appear on one active route mapping. */
export class HcfAlreadyMappedToAnotherRouteException extends ConflictException {
  constructor() {
    super(
      `This HCF is already assigned to another route. Deactivate or remove the existing mapping before assigning it here.`,
    );
  }
}
