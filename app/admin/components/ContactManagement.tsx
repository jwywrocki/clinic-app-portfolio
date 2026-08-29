'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection } from '@/components/ui/animated-section';
import { ConfirmDialog } from './ConfirmDialog';
import { ContactGroup, ContactDetail } from '@/lib/types/contact';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { stripHtmlTags } from '@/lib/html-sanitizer';
import { Plus, MinusCircle, Edit3, Trash2, GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ContactManagementProps {
  contactGroups: ContactGroup[];
  onSaveGroup: (group: ContactGroup) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onDeleteDetail: (detailId: string, groupId: string) => Promise<void>;
  onReorderGroups?: (reorderedGroups: ContactGroup[]) => Promise<void>;
  isSaving?: boolean;
}

function SortableContactDetail({
  detail,
  onEdit,
  onDelete,
}: {
  detail: ContactDetail;
  onEdit: (value: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: detail.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'phone':
        return 'Telefon';
      case 'email':
        return 'Email';
      case 'address':
        return 'Adres';
      case 'hours':
        return 'Godziny';
      case 'emergency_contact':
        return 'Kontakt awaryjny';
      default:
        return type;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border rounded bg-white ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <Label>{getContactTypeLabel(detail.type)}</Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Usuń szczegół kontaktowy"
        >
          <MinusCircle className="h-4 w-4" />
        </Button>
      </div>
      {detail.type === 'phone' || detail.type === 'email' ? (
        <Input
          value={detail.value}
          onChange={e => onEdit(e.target.value)}
          placeholder={detail.type === 'phone' ? 'Numer telefonu' : 'Adres email'}
          key={`input-${detail.id}`}
        />
      ) : detail.type === 'address' ||
        detail.type === 'hours' ||
        detail.type === 'emergency_contact' ? (
        <RichTextEditor value={detail.value} onChange={onEdit} key={`editor-${detail.id}`} />
      ) : null}
    </div>
  );
}

export function ContactManagement({
  contactGroups,
  onSaveGroup,
  onDeleteGroup,
  onDeleteDetail,
  onReorderGroups,
  isSaving = false,
}: ContactManagementProps) {
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; onConfirm: () => void }>({
    open: false,
    onConfirm: () => {},
  });
  const { toast } = useToast();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndGroups = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = contactGroups.findIndex(group => group.id === active.id);
      const newIndex = contactGroups.findIndex(group => group.id === over?.id);

      const newSortedGroups = arrayMove(contactGroups, oldIndex, newIndex);

      const updatedGroups = newSortedGroups.map((group, index) => ({
        ...group,
        order_position: index + 1,
      }));

      if (onReorderGroups) {
        await onReorderGroups(updatedGroups);
      }
    }
  };

  const handleNewGroup = () => {
    const maxOrderPosition = Math.max(0, ...contactGroups.map(g => g.order_position || 0));
    setEditingGroup({
      id: 'new-group-temp-id',
      label: '',
      in_hero: false,
      in_footer: true,
      order_position: maxOrderPosition + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contact_details: [],
    });
  };

  const handleSaveGroup = async () => {
    if (editingGroup) {
      const groupToSave = {
        ...editingGroup,
        contact_details: (editingGroup.contact_details || []).map(detail => ({
          ...detail,
          group_id: editingGroup.id,
        })),
      };
      try {
        await onSaveGroup(groupToSave);
        toast({ title: 'Sukces', description: 'Grupa kontaktowa zapisana', variant: 'success' });
        setEditingGroup(null);
        router.refresh();
      } catch (error: any) {
        toast({
          title: 'Błąd',
          description: error.message || 'Nie udało się zapisać grupy kontaktowej',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAddDetailValue = (
    groupId: string,
    type: 'phone' | 'email' | 'address' | 'hours' | 'emergency_contact'
  ) => {
    if (!editingGroup) return;

    const newDetail: ContactDetail = {
      id: `new-${Math.random().toString(36).substr(2, 9)}`,
      group_id: editingGroup.id,
      type: type,
      value: '',
      order_position: (editingGroup.contact_details?.length || 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEditingGroup({
      ...editingGroup,
      contact_details: [...(editingGroup.contact_details || []), newDetail],
    });
  };

  const handleRemoveDetailValue = useCallback(
    async (groupId: string, detailId: string) => {
      if (!editingGroup) return;

      if (detailId.startsWith('new-')) {
        setEditingGroup(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            contact_details: prev.contact_details?.filter(d => d.id !== detailId) ?? [],
          };
        });
      } else {
        await onDeleteDetail(detailId, editingGroup.id);
        setEditingGroup(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            contact_details: prev.contact_details?.filter(d => d.id !== detailId) ?? [],
          };
        });
      }
    },
    [editingGroup?.id, onDeleteDetail]
  );

  const handleDetailValueChange = useCallback(
    (originalGroupId: string, detailId: string, value: string) => {
      if (!editingGroup) return;

      setEditingGroup(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          contact_details:
            prev.contact_details?.map(d => (d.id === detailId ? { ...d, value } : d)) ?? [],
        };
      });
    },
    [editingGroup?.id]
  );

  function SortableGroupCard({
    group,
    onEdit,
    onDelete,
  }: {
    group: ContactGroup;
    onEdit: (group: ContactGroup) => void;
    onDelete: (groupId: string) => void;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: group.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const getContactTypeLabel = (type: string) => {
      switch (type) {
        case 'phone':
          return 'Telefon';
        case 'email':
          return 'Email';
        case 'address':
          return 'Adres';
        case 'hours':
          return 'Godziny';
        case 'emergency_contact':
          return 'Kontakt awaryjny';
        default:
          return type;
      }
    };

    return (
      <div ref={setNodeRef} style={style}>
        <Card className={`border shadow-sm ${isDragging ? 'shadow-lg' : ''}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div
                className="mr-2 cursor-grab active:cursor-grabbing flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{group.label}</CardTitle>
                <div className="flex gap-1 mt-1">
                  {group.in_hero && (
                    <Badge variant="default" className="text-xs">
                      Strona główna
                    </Badge>
                  )}
                  {group.in_footer && (
                    <Badge variant="secondary" className="text-xs">
                      Stopka
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(group)}
                  title="Edytuj grupę kontaktową"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(group.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Usuń grupę kontaktową"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {group.contact_details && group.contact_details.length > 0 ? (
              <ul className="space-y-1 text-sm text-gray-600">
                {group.contact_details
                  .sort((a, b) => (a.order_position || 0) - (b.order_position || 0))
                  .slice(0, 3)
                  .map(detail => (
                    <li key={detail.id} className="flex">
                      <span className="font-medium w-28 shrink-0">
                        {getContactTypeLabel(detail.type)}:
                      </span>
                      <span className="truncate" title={stripHtmlTags(detail.value)}>
                        {stripHtmlTags(detail.value)}
                      </span>
                    </li>
                  ))}
                {group.contact_details.length > 3 && (
                  <li className="text-gray-400">+{group.contact_details.length - 3} więcej...</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Brak szczegółów kontaktowych dla tej grupy.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDragEndDetails = async (event: DragEndEvent) => {
    if (!editingGroup) return;

    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex =
        editingGroup.contact_details?.findIndex(detail => detail.id === active.id) ?? -1;
      const newIndex =
        editingGroup.contact_details?.findIndex(detail => detail.id === over?.id) ?? -1;

      if (oldIndex >= 0 && newIndex >= 0 && editingGroup.contact_details) {
        const newSortedDetails = arrayMove(editingGroup.contact_details, oldIndex, newIndex);

        const updatedDetails = newSortedDetails.map((detail, index) => ({
          ...detail,
          order_position: index + 1,
        }));

        setEditingGroup({
          ...editingGroup,
          contact_details: updatedDetails,
        });
      }
    }
  };

  return (
    <AnimatedSection animation="fadeInUp">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Zarządzanie Danymi Kontaktowymi</CardTitle>
            <Button onClick={handleNewGroup}>
              <Plus className="h-4 w-4 mr-2" /> Dodaj grupę kontaktową
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingGroup ? (
            <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold">
                {editingGroup.id ? 'Edytuj' : 'Dodaj'} Grupę kontaktową
              </h3>
              <div>
                <Label htmlFor="groupLabel">Etykieta Grupy</Label>
                <Input
                  id="groupLabel"
                  value={editingGroup.label}
                  onChange={e => setEditingGroup({ ...editingGroup, label: e.target.value })}
                  placeholder="Np. Rejestracja Poradni Ogólnej"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="groupInHero"
                    checked={editingGroup.in_hero}
                    onCheckedChange={checked =>
                      setEditingGroup({ ...editingGroup, in_hero: checked })
                    }
                  />
                  <Label htmlFor="groupInHero">Wyświetl na stronie głównej</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="groupInFooter"
                    checked={editingGroup.in_footer}
                    onCheckedChange={checked =>
                      setEditingGroup({ ...editingGroup, in_footer: checked })
                    }
                  />
                  <Label htmlFor="groupInFooter">Wyświetl w stopce</Label>
                </div>
              </div>

              <div className="space-y-4">
                {editingGroup.contact_details && editingGroup.contact_details.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndDetails}
                  >
                    <SortableContext
                      items={editingGroup.contact_details.map(detail => detail.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {editingGroup.contact_details
                        .sort((a, b) => (a.order_position || 0) - (b.order_position || 0))
                        .map(detail => {
                          const onEdit = (value: string) =>
                            handleDetailValueChange(editingGroup.id, detail.id, value);
                          const onDelete = () =>
                            handleRemoveDetailValue(editingGroup.id, detail.id);

                          return (
                            <SortableContactDetail
                              key={`detail-${detail.id}`}
                              detail={detail}
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          );
                        })}
                    </SortableContext>
                  </DndContext>
                ) : null}
              </div>

              <div className="flex space-x-2 mt-2">
                <Button
                  onClick={() => handleAddDetailValue(editingGroup.id, 'phone')}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" /> Dodaj telefon
                </Button>
                <Button
                  onClick={() => handleAddDetailValue(editingGroup.id, 'email')}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" /> Dodaj email
                </Button>
                {!editingGroup.contact_details?.find(d => d.type === 'address') && (
                  <Button
                    onClick={() => handleAddDetailValue(editingGroup.id, 'address' as any)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Dodaj adres
                  </Button>
                )}
                {!editingGroup.contact_details?.find(d => d.type === 'hours') && (
                  <Button
                    onClick={() => handleAddDetailValue(editingGroup.id, 'hours' as any)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Dodaj godziny
                  </Button>
                )}
                {!editingGroup.contact_details?.find(d => d.type === 'emergency_contact') && (
                  <Button
                    onClick={() =>
                      handleAddDetailValue(editingGroup.id, 'emergency_contact' as any)
                    }
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Dodaj kontakt alarmowy
                  </Button>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSaveGroup} disabled={isSaving}>
                  {isSaving ? 'Zapisywanie...' : 'Zapisz grupę'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingGroup(null)}
                  disabled={isSaving}
                >
                  Anuluj
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {contactGroups.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndGroups}
                >
                  <SortableContext
                    items={contactGroups.map(group => group.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {contactGroups
                      .sort((a, b) => (a.order_position || 0) - (b.order_position || 0))
                      .map(group => (
                        <SortableGroupCard
                          key={group.id}
                          group={group}
                          onEdit={setEditingGroup}
                          onDelete={(groupId: string) => {
                            setConfirmDialog({
                              open: true,
                              onConfirm: async () => {
                                try {
                                  await onDeleteGroup(groupId);
                                  toast({
                                    title: 'Sukces',
                                    description: 'Grupa kontaktowa usunięta',
                                    variant: 'success',
                                  });
                                  router.refresh();
                                } catch (error: any) {
                                  toast({
                                    title: 'Błąd',
                                    description:
                                      error.message || 'Nie udało się usunąć grupy kontaktowej',
                                    variant: 'destructive',
                                  });
                                }
                              },
                            });
                          }}
                        />
                      ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Brak zdefiniowanych grup kontaktowych.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={open => setConfirmDialog(prev => ({ ...prev, open }))}
        title="Usuń grupę kontaktową"
        description="Czy na pewno chcesz usunąć tę grupę kontaktową? Tej operacji nie można cofnąć."
        onConfirm={confirmDialog.onConfirm}
      />
    </AnimatedSection>
  );
}
