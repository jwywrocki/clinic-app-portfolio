import { createContactService } from '@/services';
import { ContactManagement } from '../../components/ContactManagement';
import {
  saveContactGroupAction,
  deleteContactGroupAction,
  deleteContactDetailAction,
  reorderContactGroupsAction,
} from '../../actions/contact';

export default async function AdminContactPage() {
  const contactService = createContactService();
  const contactGroupsResult = await contactService.getAllGroupsWithDetails();
  if (contactGroupsResult.isFailure()) {
    throw contactGroupsResult.error;
  }

  return (
    <ContactManagement
      contactGroups={contactGroupsResult.data}
      onSaveGroup={saveContactGroupAction}
      onDeleteGroup={deleteContactGroupAction}
      onDeleteDetail={deleteContactDetailAction}
      onReorderGroups={reorderContactGroupsAction}
    />
  );
}
