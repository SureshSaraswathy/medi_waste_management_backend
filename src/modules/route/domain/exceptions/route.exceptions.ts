import { NotFoundException, ConflictException } from '@nestjs/common';

export class RouteNotFoundException extends NotFoundException {
  constructor(routeId: string) {
    super(`Route with ID ${routeId} not found`);
  }
}

export class DuplicateRouteCodeException extends ConflictException {
  constructor(routeCode: string) {
    super(`Route with code "${routeCode}" already exists for this company`);
  }
}

export class DuplicateRouteNameException extends ConflictException {
  constructor(routeName: string) {
    super(`Route with name "${routeName}" already exists for this company`);
  }
}
