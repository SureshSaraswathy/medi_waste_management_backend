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
