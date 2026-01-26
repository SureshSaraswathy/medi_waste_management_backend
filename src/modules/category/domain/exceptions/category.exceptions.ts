import { NotFoundException, ConflictException } from '@nestjs/common';

export class CategoryNotFoundException extends NotFoundException {
  constructor(categoryId: string) {
    super(`Category with ID ${categoryId} not found`);
  }
}

export class DuplicateCategoryCodeException extends ConflictException {
  constructor(categoryCode: string) {
    super(`Category with code "${categoryCode}" already exists for this company`);
  }
}

export class DuplicateCategoryNameException extends ConflictException {
  constructor(categoryName: string) {
    super(`Category with name "${categoryName}" already exists for this company`);
  }
}
