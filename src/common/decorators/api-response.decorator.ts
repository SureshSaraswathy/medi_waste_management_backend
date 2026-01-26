// API Response decorator for future Swagger/OpenAPI integration
// Uncomment when @nestjs/swagger is added to dependencies
/*
import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse as SwaggerApiResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiResponse = <TModel extends Type<unknown>>(model: TModel) => {
  return applyDecorators(
    SwaggerApiResponse({
      schema: {
        allOf: [{ $ref: getSchemaPath(model) }],
      },
    }),
  );
};
*/

export const ApiResponse = () => {
  // Placeholder for future implementation
  return () => {};
};
