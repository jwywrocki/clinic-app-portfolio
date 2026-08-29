import { SurveysManagement } from '../../components/SurveysManagement';

export default async function AdminSurveysPage() {
  // We'll mimic the existing surveys management fetching pattern. Usually it fetches on the client,
  // but we can pass an initial state if needed. The component handles its own data fetching right now.

  return (
    <SurveysManagement
      onSave={async () => {
        'use server'; /* To be implemented */
      }}
      currentUser={null} // Will need to get this from session/cookies in the layout
      isSaving={false}
    />
  );
}
