import { Controller, Get } from '@nestjs/common';

/**
 * Health/Welcome Controller
 * Simple test endpoint to verify API is working
 */
@Controller()
export class HealthController {
  @Get()
  getWelcome() {
    return {
      success: true,
      message: 'Welcome to Medical Waste Management API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        users: '/api/v1/users',
        samples: '/api/v1/samples',
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      message: 'API is healthy and running',
      timestamp: new Date().toISOString(),
    };
  }
}
