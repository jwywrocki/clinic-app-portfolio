import { MenuManagement } from '../../components/MenuManagement';
import { saveMenuAction, updateMenuOrderAction, deleteMenuAction } from '../../actions/menus';
import { MenuItem } from '@/lib/types/menu';
import { createMenusService } from '@/services';

export default async function AdminMenusPage() {
  const menusService = createMenusService();
  const menuItemsResult = await menusService.getAll();
  const menuItems: MenuItem[] = menuItemsResult.isFailure() ? [] : menuItemsResult.data;

  return (
    <MenuManagement
      menuItems={menuItems as MenuItem[]}
      onSave={saveMenuAction}
      onUpdateOrder={updateMenuOrderAction as any}
      onDelete={deleteMenuAction}
    />
  );
}
