/**
 * Dashboard Service
 * 
 * Business logic for dashboard configuration management.
 * This service handles CRUD operations for dashboard configurations.
 * 
 * Dashboard APIs are read-only and do not modify business logic.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardConfigDto, UpdateDashboardConfigDto } from './dto/dashboard-config.dto';
import { DashboardConfigEntity } from './entities/dashboard-config.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DashboardConfigEntity, 'report')
    private readonly configRepository: Repository<DashboardConfigEntity>,
  ) {}

  // Debug logs were added temporarily during troubleshooting; keep a no-op logger to avoid noisy output.
  // (Errors are still logged via console.error / thrown exceptions.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private debugLog(..._args: any[]) {}

  /**
   * Get dashboard configuration for a specific role
   * Returns default empty configuration if not found
   */
  async getDashboardConfig(role: string): Promise<DashboardConfigDto> {
    try {
      const config = await this.configRepository.findOne({
        where: { role },
      });

      if (!config) {
        // Return default empty configuration
        return {
          role,
          widgets: [],
          menuItems: [],
          permissions: {},
        };
      }

      // Log raw database values BEFORE normalization
      this.debugLog('[DashboardService] Raw database config for role:', {
        role: config.role,
        rawWidgets: config.widgets,
        rawWidgetsType: typeof config.widgets,
        rawWidgetsIsArray: Array.isArray(config.widgets),
        rawWidgetsString: JSON.stringify(config.widgets),
      });

      // Normalize widgets to ensure they're always an array of objects
      let widgets: any[] = [];
      if (Array.isArray(config.widgets)) {
        this.debugLog('[DashboardService] Widgets is array, length:', config.widgets.length);
        // Filter out invalid entries (empty arrays, null, undefined, non-objects)
        widgets = config.widgets.filter((w: any) => {
          const isValid = w && typeof w === 'object' && !Array.isArray(w);
          if (!isValid) {
            this.debugLog('[DashboardService] Filtering out invalid widget:', {
              widget: w,
              type: typeof w,
              isArray: Array.isArray(w),
            });
          }
          return isValid;
        });
      } else if (config.widgets && typeof config.widgets === 'object' && !Array.isArray(config.widgets)) {
        // If widgets is a single object, wrap it in an array
        widgets = [config.widgets];
      }
      
      // Normalize menuItems
      const menuItems = Array.isArray(config.menuItems) ? config.menuItems : [];
      
      // Normalize permissions
      const permissions = config.permissions && typeof config.permissions === 'object' && !Array.isArray(config.permissions) 
        ? config.permissions 
        : {};
      
      this.debugLog('[DashboardService] Normalized config for role:', {
        role: config.role,
        widgetsCount: widgets.length,
        menuItemsCount: menuItems.length,
        widgets: widgets,
      });
      
      return {
        role: config.role,
        widgets,
        menuItems,
        permissions,
      };
    } catch (error) {
      // If table doesn't exist or connection error, return default config
      console.error('[DashboardService] Error fetching dashboard config:', error);
      // Check if it's a table not found error
      if (error.message && error.message.includes('does not exist')) {
        console.warn('[DashboardService] Table dashboard_configs does not exist. Please run the migration script.');
      }
      // Return default configuration instead of throwing
      return {
        role,
        widgets: [],
        menuItems: [],
        permissions: {},
      };
    }
  }

  /**
   * Update dashboard configuration for a specific role
   * Creates new configuration if it doesn't exist, updates if it does
   */
  async updateDashboardConfig(
    role: string,
    updateDto: UpdateDashboardConfigDto,
  ): Promise<DashboardConfigDto> {
    try {
      // Log what we're receiving
      this.debugLog('[DashboardService] Received updateDto:', {
        role,
        widgetsType: typeof updateDto.widgets,
        widgetsIsArray: Array.isArray(updateDto.widgets),
        widgetsLength: Array.isArray(updateDto.widgets) ? updateDto.widgets.length : 'N/A',
        widgets: updateDto.widgets,
      });

      // Normalize widgets to ensure they're always an array of objects
      // Handle nested arrays and flatten them
      let normalizedWidgets: any[] = [];
      
      // Helper function to check if an object is a valid widget (even if it's array-like)
      const isValidWidget = (obj: any): boolean => {
        if (!obj || typeof obj !== 'object') {
          return false;
        }
        // Check if it has at least one widget property (even if it's array-like)
        return !!(obj.id || obj.type || obj.title || obj.dataSource);
      };

      /**
       * IMPORTANT: The frontend is sometimes sending "array-like widgets" (Array instances).
       * Arrays can have extra props (id/type/title), but JSON serialization drops them and produces `[]`.
       * That is exactly how we end up with widgets like `[[]]` in Postgres JSONB.
       *
       * This helper converts any widget-ish input into a plain JSON object suitable for JSONB storage.
       */
      const toPlainWidget = (obj: any): any | null => {
        if (!obj || typeof obj !== 'object') return null;

        // Whitelist known widget fields (prevents accidentally storing array internals / numeric keys)
        const fields = [
          'id',
          'type',
          'title',
          'description',
          'gridColumn',
          'gridRow',
          'size',
          'enabled',
          'dataSource',
          'chartConfig',
          'tableConfig',
          'permissions',
          'meta',
        ];

        const plain: any = {};
        for (const f of fields) {
          if (obj[f] !== undefined) plain[f] = obj[f];
        }

        // If nothing was copied but it looked like a widget, fall back to spreading enumerable props.
        // This is still safer than storing the array directly (which serializes to `[]`).
        if (Object.keys(plain).length === 0 && isValidWidget(obj)) {
          return { ...(obj as any) };
        }

        return Object.keys(plain).length > 0 ? plain : null;
      };

      const pushWidget = (candidate: any, logLabel: string) => {
        const plain = toPlainWidget(candidate);
        if (!plain) return;
        if (plain.id && normalizedWidgets.find((w: any) => w?.id === plain.id)) return;
        normalizedWidgets.push(plain);
        this.debugLog(`[DashboardService] ${logLabel}`, {
          id: plain.id,
          type: plain.type,
          title: plain.title,
          isArrayLike: Array.isArray(candidate),
        });
      };
      
      // Helper function to recursively flatten arrays and extract valid widget objects
      const extractWidgets = (input: any, depth: number = 0): void => {
        const indent = '  '.repeat(depth);
        
        if (input === null || input === undefined) {
          this.debugLog(`${indent}[DashboardService] Skipping null/undefined`);
          return;
        }
        
        // IMPORTANT: Check if it's a valid widget FIRST, even if it's array-like
        // This handles cases where an object has both array indices and widget properties
        if (isValidWidget(input)) {
          pushWidget(input, `${indent}✓ Added widget (normalized)`);
          return; // Don't process further if it's a valid widget
        }
        
        // Now check if it's an array
        if (Array.isArray(input)) {
          this.debugLog(`${indent}[DashboardService] Input is array, length: ${input.length}`);
          if (input.length === 0) {
            this.debugLog(`${indent}[DashboardService] Empty array, skipping`);
            return;
          }
          // Process each element
          input.forEach((item: any, idx: number) => {
            this.debugLog(`${indent}[DashboardService] Processing array item ${idx}:`, {
              type: typeof item,
              isArray: Array.isArray(item),
              hasId: !!item?.id,
              hasType: !!item?.type,
            });
            extractWidgets(item, depth + 1);
          });
        } else if (input && typeof input === 'object') {
          // It's an object but not a valid widget, try to extract widgets from its properties
          this.debugLog(`${indent}[DashboardService] Object is not a valid widget, checking properties:`, {
            keys: Object.keys(input),
            valuesCount: Object.values(input).length,
          });
          
          // Try to extract widgets from object values
          Object.values(input).forEach((value: any, idx: number) => {
            if (isValidWidget(value)) {
              pushWidget(value, `${indent}✓ Added widget from object property ${idx}`);
            } else if (value && (Array.isArray(value) || typeof value === 'object')) {
              extractWidgets(value, depth + 1);
            }
          });
        } else {
          this.debugLog(`${indent}[DashboardService] ✗ Skipping primitive value:`, typeof input);
        }
      };
      
      if (Array.isArray(updateDto.widgets)) {
        this.debugLog('[DashboardService] Processing widgets array, length:', updateDto.widgets.length);
        this.debugLog('[DashboardService] Raw widgets structure:', JSON.stringify(updateDto.widgets, null, 2));
        
        // Process each widget (which might be nested arrays or array-like objects)
        updateDto.widgets.forEach((w: any, index: number) => {
          this.debugLog(`[DashboardService] Processing widget ${index}:`, {
            widget: w,
            type: typeof w,
            isArray: Array.isArray(w),
            length: Array.isArray(w) ? w.length : 'N/A',
            hasId: !!w?.id,
            hasType: !!w?.type,
            hasTitle: !!w?.title,
            hasDataSource: !!w?.dataSource,
            keys: w && typeof w === 'object' ? Object.keys(w) : null,
            stringified: JSON.stringify(w),
          });
          
          // CRITICAL: Check for widget properties FIRST, even if it's array-like
          // This handles array-like objects that have widget properties
          if (w && typeof w === 'object' && (w.id || w.type || w.title || w.dataSource)) {
            // It has widget properties - check if it's actually an array with elements
            if (Array.isArray(w) && w.length > 0) {
              // It's an array with elements - check if first element is a widget
              if (w[0] && typeof w[0] === 'object' && (w[0].id || w[0].type || w[0].title)) {
                this.debugLog(`[DashboardService] Widget ${index} is array with widget object at index 0, extracting`);
                pushWidget(w[0], `✓ Extracted widget from array index ${index} (item 0)`);
              } else {
                // Array has elements but first isn't a widget - might be array-like object
                // Extract all valid widgets from array
                w.forEach((item: any, itemIdx: number) => {
                  if (item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.type || item.title)) {
                    pushWidget(item, `✓ Extracted widget from array index ${index} (item ${itemIdx})`);
                  }
                });
              }
            } else {
              // It has widget properties - add it directly as a widget (even if array-like)
              // This handles array-like objects that have widget properties but stringify to []
              this.debugLog(`[DashboardService] Widget ${index} has widget properties, adding directly (array-like: ${Array.isArray(w)}, length: ${Array.isArray(w) ? w.length : 'N/A'})`);
              pushWidget(w, `✓ Added widget from array-like object at index ${index}`);
            }
          }
          // If no widget properties, try to extract from structure
          else if (Array.isArray(w)) {
            if (w.length === 0) {
              this.debugLog(`[DashboardService] Widget ${index} is empty array, skipping`);
            } else if (w.length === 1 && w[0] && typeof w[0] === 'object' && (w[0].id || w[0].type || w[0].title)) {
              this.debugLog(`[DashboardService] Widget ${index} is array with one widget object, extracting`);
              pushWidget(w[0], `✓ Extracted widget from array index ${index} (single item)`);
            } else {
              this.debugLog(`[DashboardService] Widget ${index} is array with ${w.length} elements, extracting recursively`);
              extractWidgets(w);
            }
          } else {
            this.debugLog(`[DashboardService] Widget ${index} using recursive extraction`);
            extractWidgets(w);
          }
        });
      } else if (updateDto.widgets && typeof updateDto.widgets === 'object' && !Array.isArray(updateDto.widgets)) {
        // If widgets is a single object, extract it
        this.debugLog('[DashboardService] Widgets is a single object, extracting');
        extractWidgets(updateDto.widgets);
      } else {
        this.debugLog('[DashboardService] Widgets is not an array or object:', {
          widgets: updateDto.widgets,
          type: typeof updateDto.widgets,
        });
      }
      
      // Normalize menuItems
      const normalizedMenuItems = Array.isArray(updateDto.menuItems) ? updateDto.menuItems : [];
      
      // Normalize permissions
      const normalizedPermissions = updateDto.permissions && typeof updateDto.permissions === 'object' && !Array.isArray(updateDto.permissions)
        ? updateDto.permissions
        : {};
      
      this.debugLog('[DashboardService] Normalizing widgets before save:', {
        role,
        originalWidgetsCount: Array.isArray(updateDto.widgets) ? updateDto.widgets.length : 0,
        normalizedWidgetsCount: normalizedWidgets.length,
        normalizedWidgets: normalizedWidgets,
        normalizedWidgetsString: JSON.stringify(normalizedWidgets, null, 2),
      });
      
      // CRITICAL: If normalizedWidgets is empty but we received widgets, something went wrong
      if (normalizedWidgets.length === 0 && updateDto.widgets && Array.isArray(updateDto.widgets) && updateDto.widgets.length > 0) {
        console.error('[DashboardService] ERROR: Widgets were received but extraction resulted in empty array!', {
          receivedWidgets: updateDto.widgets,
          receivedWidgetsString: JSON.stringify(updateDto.widgets, null, 2),
        });
        
        // Try a more aggressive extraction as fallback
        // Flatten all arrays and extract any object that looks like a widget
        const flattenAndExtract = (arr: any[]): void => {
          arr.forEach((item: any) => {
            if (Array.isArray(item)) {
              flattenAndExtract(item);
            } else if (item && typeof item === 'object' && (item.id || item.type || item.title || item.dataSource)) {
              // Check if we already have this widget (by id)
              pushWidget(item, 'FALLBACK: Extracted widget');
            }
          });
        };
        
        flattenAndExtract(updateDto.widgets);
        
        this.debugLog('[DashboardService] After fallback extraction:', {
          normalizedWidgetsCount: normalizedWidgets.length,
          normalizedWidgets: normalizedWidgets,
        });
        
        // If still empty after fallback, log error but don't throw - allow empty widgets to be saved
        if (normalizedWidgets.length === 0) {
          console.error('[DashboardService] CRITICAL: Failed to extract widgets even after fallback extraction!', {
            receivedWidgets: updateDto.widgets,
            receivedWidgetsString: JSON.stringify(updateDto.widgets, null, 2),
          });
          // Don't throw - allow empty widgets to be saved (user can fix the configuration)
          // This prevents the save from failing completely
        }
      }
      
      const existing = await this.configRepository.findOne({
        where: { role },
      });

      if (existing) {
        this.debugLog('[DashboardService] Updating existing config, before save:', {
          existingWidgets: existing.widgets,
          newWidgets: normalizedWidgets,
        });
        
        // Update existing configuration
        // Use update() method to ensure jsonb columns are properly persisted
        this.debugLog('[DashboardService] Updating config with save() method:', {
          role,
          normalizedWidgetsCount: normalizedWidgets.length,
          normalizedWidgets: normalizedWidgets,
          existingId: existing.id,
        });
        
        // Use save() method instead of update() for better jsonb handling
        // Update the entity properties
        existing.widgets = normalizedWidgets;
        existing.menuItems = normalizedMenuItems;
        existing.permissions = normalizedPermissions;
        
        this.debugLog('[DashboardService] Entity before save:', {
          role: existing.role,
          widgets: existing.widgets,
          widgetsType: typeof existing.widgets,
          widgetsIsArray: Array.isArray(existing.widgets),
          widgetsLength: Array.isArray(existing.widgets) ? existing.widgets.length : 'N/A',
          widgetsString: JSON.stringify(existing.widgets),
        });
        
        // Save the entity
        const saved = await this.configRepository.save(existing);
        
        this.debugLog('[DashboardService] Entity after save:', {
          role: saved.role,
          widgets: saved.widgets,
          widgetsType: typeof saved.widgets,
          widgetsIsArray: Array.isArray(saved.widgets),
          widgetsLength: Array.isArray(saved.widgets) ? saved.widgets.length : 'N/A',
          widgetsString: JSON.stringify(saved.widgets),
        });
        
        // Verify by reloading from database
        const verifyConfig = await this.configRepository.findOne({
          where: { role },
        });
        
        if (!verifyConfig) {
          throw new Error(`Failed to save dashboard config for role: ${role}`);
        }
        
        this.debugLog('[DashboardService] Verification query after save:', {
          role: verifyConfig.role,
          widgets: verifyConfig.widgets,
          widgetsType: typeof verifyConfig.widgets,
          widgetsIsArray: Array.isArray(verifyConfig.widgets),
          widgetsLength: Array.isArray(verifyConfig.widgets) ? verifyConfig.widgets.length : 'N/A',
          widgetsString: JSON.stringify(verifyConfig.widgets),
        });
        
        // IMPORTANT: Return verifyConfig.widgets (what's actually in the database)
        // If verifyConfig.widgets is empty but normalizedWidgets has data, use normalizedWidgets as fallback
        const finalWidgets = (Array.isArray(verifyConfig.widgets) && verifyConfig.widgets.length > 0) 
          ? verifyConfig.widgets 
          : normalizedWidgets;
        
        this.debugLog('[DashboardService] Returning config with widgets:', {
          finalWidgetsCount: finalWidgets.length,
          finalWidgets: finalWidgets,
          verifyConfigWidgetsCount: Array.isArray(verifyConfig.widgets) ? verifyConfig.widgets.length : 0,
          normalizedWidgetsCount: normalizedWidgets.length,
        });
        
        return {
          role: verifyConfig.role,
          widgets: finalWidgets,
          menuItems: verifyConfig.menuItems || normalizedMenuItems || [],
          permissions: verifyConfig.permissions || normalizedPermissions || {},
        };
      } else {
        this.debugLog('[DashboardService] Creating new config with widgets:', normalizedWidgets);
        
        // Create new configuration
        const newConfig = this.configRepository.create({
          role,
          widgets: normalizedWidgets,
          menuItems: normalizedMenuItems,
          permissions: normalizedPermissions,
        });

        const saved = await this.configRepository.save(newConfig);
        
        this.debugLog('[DashboardService] New config saved, after save:', {
          savedWidgets: saved.widgets,
          savedWidgetsType: typeof saved.widgets,
          savedWidgetsIsArray: Array.isArray(saved.widgets),
          savedWidgetsLength: Array.isArray(saved.widgets) ? saved.widgets.length : 'N/A',
          savedWidgetsString: JSON.stringify(saved.widgets),
        });
        
        // Verify by querying immediately after save
        const verifyConfig = await this.configRepository.findOne({
          where: { role },
        });
        this.debugLog('[DashboardService] Verification query after save:', {
          role: verifyConfig?.role,
          widgets: verifyConfig?.widgets,
          widgetsType: typeof verifyConfig?.widgets,
          widgetsIsArray: Array.isArray(verifyConfig?.widgets),
          widgetsLength: Array.isArray(verifyConfig?.widgets) ? verifyConfig.widgets.length : 'N/A',
          widgetsString: JSON.stringify(verifyConfig?.widgets),
        });
        
        return {
          role: saved.role,
          widgets: saved.widgets || [],
          menuItems: saved.menuItems || [],
          permissions: saved.permissions || {},
        };
      }
    } catch (error) {
      console.error('[DashboardService] Error saving dashboard config:', error);
      // Check if it's a table not found error
      if (error.message && error.message.includes('does not exist')) {
        throw new Error('Dashboard configuration table does not exist. Please run the migration script: scripts/create_dashboard_configs_table.sql');
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all available roles for dashboard configuration
   */
  async getAvailableRoles(): Promise<string[]> {
    // Return default roles
    // In production, you might fetch from a role table
    return [
      'superadmin',
      'manager',
      'accountant',
      'supervisor',
      'driver',
      'audit',
      'ao',
      'dataentry',
      'field-executive',
      'factory-incharge',
    ];
  }
}
