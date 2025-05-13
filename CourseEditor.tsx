// src/components/features/admin/CourseEditor.tsx
// This component provides a comprehensive interface for managing an entire course's content,
// including its metadata, modules, and lessons. It acts as a central hub for course editing.
// Developed by Luccas A E | 2025

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation'; // For courseId and navigation
import {
  AdminCourse,
  AdminModule,
  CourseEditFormData,
  ModuleEditFormData,
  ApiErrorResponse,
  // Types for API responses for fetching/updating course
} from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, PlusCircle, ArrowUp, ArrowDown, Trash2, Eye, Shield, ShieldOff } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { CourseForm } from './CourseForm'; // For editing course metadata
import { ModuleEditor } from './ModuleEditor'; // For editing individual modules
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- API Interaction Functions (Simulated - replace with actual API client calls) ---
const fetchAdminCourseDetails = async (courseId: string): Promise<AdminCourse> => {
  const response = await fetch(`/api/admin/courses/${courseId}`); // Example endpoint
  if (!response.ok) {
    const errData: ApiErrorResponse = await response.json();
    throw new Error(errData.error.message || 'Failed to fetch course details.');
  }
  const res = await response.json();
  return res.data; // Assuming API response is { success: true, data: AdminCourse }
};

const updateAdminCourse = async (courseId: string, courseData: Partial<AdminCourse>): Promise<AdminCourse> => {
  const response = await fetch(`/api/admin/courses/${courseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(courseData),
  });
  if (!response.ok) {
    const errData: ApiErrorResponse = await response.json();
    throw new Error(errData.error.message || 'Failed to update course.');
  }
  const res = await response.json();
  return res.data;
};
// --- End API Interaction Functions ---

interface SortableModuleItemProps {
  module: AdminModule;
  moduleIndex: number;
  courseId: string;
  onModuleChange: (index: number, updatedModule: AdminModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
  // onLessonChange, onDeleteLesson would be passed down to ModuleEditor -> LessonEditor
}

// Sortable Item component for Modules
const SortableModuleItem: React.FC<SortableModuleItemProps> = ({ module, moduleIndex, courseId, onModuleChange, onDeleteModule, onAddLesson }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="mb-4">
            <ModuleEditor
                key={module.id} // Ensure re-render if module object changes identity
                moduleData={module}
                moduleIndex={moduleIndex}
                courseId={courseId}
                onModuleChange={(updatedModuleData) => onModuleChange(moduleIndex, updatedModuleData)}
                onDeleteModule={() => onDeleteModule(module.id)}
                onAddLessonToModule={() => onAddLesson(module.id)}
                dndHandleListeners={listeners} // Pass D&D listeners to the drag handle in ModuleEditor
            />
        </div>
    );
};


/**
 * CourseEditor provides a comprehensive UI for managing course content including metadata,
 * modules, and lessons.
 */
export const CourseEditor: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string; // Assuming route is /admin/courses/[courseId]/edit

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editedCourse, setEditedCourse] = useState<AdminCourse | null>(null);
  const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]); // For module accordions

  // Fetch course details
  const { data: fetchedCourse, isLoading, error, refetch } = useQuery<AdminCourse, Error>(
    ['adminCourseDetails', courseId],
    () => fetchAdminCourseDetails(courseId),
    {
      enabled: !!courseId, // Only fetch if courseId is present
      onSuccess: (data) => {
        setEditedCourse(JSON.parse(JSON.stringify(data))); // Deep copy for editing
        // Optionally expand the first module or all modules
        if (data.modules && data.modules.length > 0) {
            // setActiveAccordionItems([data.modules[0].id]); // Expand first module
        }
      },
    }
  );

  // Mutation for updating the course
  const mutation = useMutation<AdminCourse, Error, Partial<AdminCourse>>(
    (courseData) => updateAdminCourse(courseId, courseData),
    {
      onSuccess: (updatedData) => {
        toast({ title: 'Course Saved!', description: `${updatedData.title} has been updated successfully.`, variant: 'success' });
        queryClient.invalidateQueries(['adminCourseDetails', courseId]);
        queryClient.invalidateQueries(['adminCourses']); // Invalidate list if it exists
        setEditedCourse(JSON.parse(JSON.stringify(updatedData))); // Update local state with saved data
      },
      onError: (err) => {
        toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
      },
    }
  );

  // Handle changes to course metadata from CourseForm
  const handleMetadataChange = useCallback((formData: CourseEditFormData) => {
    setEditedCourse(prev => prev ? { ...prev, ...formData } as AdminCourse : null);
  }, []);

  // Handle changes within a specific module (bubbled up from ModuleEditor)
  const handleModuleChange = useCallback((moduleIndex: number, updatedModuleData: AdminModule) => {
    setEditedCourse(prev => {
      if (!prev) return null;
      const newModules = [...prev.modules];
      newModules[moduleIndex] = updatedModuleData;
      return { ...prev, modules: newModules };
    });
  }, []);

  // Add a new module
  const handleAddModule = useCallback(() => {
    setEditedCourse(prev => {
      if (!prev) return null;
      const newModule: AdminModule = {
        id: `new-module-${Date.now()}`, // Temporary client-side ID
        title: `New Module ${prev.modules.length + 1}`,
        moduleNumber: prev.modules.length + 1,
        description: '',
        lessons: [],
        courseId: prev.id,
        isPublished: false,
        createdAt: new Date(), // Should be set by backend
        updatedAt: new Date(), // Should be set by backend
      };
      const updatedModules = [...prev.modules, newModule];
      // Automatically open the new module accordion
      setActiveAccordionItems(prevItems => [...prevItems, newModule.id]);
      return { ...prev, modules: updatedModules };
    });
  }, []);

  // Delete a module
  const handleDeleteModule = useCallback((moduleIdToDelete: string) => {
    if (!window.confirm("Are you sure you want to delete this module and all its lessons? This action cannot be undone.")) return;
    setEditedCourse(prev => {
      if (!prev) return null;
      return { ...prev, modules: prev.modules.filter(m => m.id !== moduleIdToDelete) };
    });
    toast({ title: "Module Removed", description: "Module (and its lessons) removed. Save the course to persist this change.", variant: "info" });
  }, [toast]);

  // Add a new lesson to a specific module (placeholder, actual form/modal would open)
  const handleAddLessonToModule = useCallback((moduleId: string) => {
    setEditedCourse(prev => {
        if (!prev) return null;
        const moduleIndex = prev.modules.findIndex(m => m.id === moduleId);
        if (moduleIndex === -1) return prev;

        const newLesson: any /* AdminLesson */ = { // Assuming AdminLesson type structure
            id: `new-lesson-${Date.now()}`,
            title: `New Lesson ${prev.modules[moduleIndex].lessons.length + 1}`,
            lessonNumber: prev.modules[moduleIndex].lessons.length + 1,
            content: '<p>Start writing your lesson content here...</p>',
            overview: '',
            moduleId: moduleId,
            courseId: prev.id,
            isPublished: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const newModules = [...prev.modules];
        newModules[moduleIndex] = {
            ...newModules[moduleIndex],
            lessons: [...newModules[moduleIndex].lessons, newLesson]
        };
        return { ...prev, modules: newModules };
    });
    toast({ title: "Lesson Added", description: "New lesson added to module. Fill in details and save.", variant: "info" });
  }, [toast]);


  const handleSaveChanges = () => {
    if (!editedCourse) return;
    // Add validation here before submitting
    // Re-calculate moduleNumber and lessonNumber before saving to ensure sequence
    const courseToSave = {
        ...editedCourse,
        modules: editedCourse.modules.map((mod, index) => ({
            ...mod,
            moduleNumber: index + 1,
            lessons: mod.lessons.map((lesson, lessonIdx) => ({
                ...lesson,
                lessonNumber: lessonIdx + 1,
            })),
        })),
    };
    mutation.mutate(courseToSave);
  };

  const toggleCoursePublishedStatus = () => {
    setEditedCourse(prev => prev ? { ...prev, isPublished: !prev.isPublished } as AdminCourse : null);
  };

  // D&D Sensors and Handler
  const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
      })
  );

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (active.id !== over?.id && editedCourse && over) {
          setEditedCourse(prev => {
              if (!prev) return null;
              const oldIndex = prev.modules.findIndex(m => m.id === active.id);
              const newIndex = prev.modules.findIndex(m => m.id === over.id);
              if (oldIndex === -1 || newIndex === -1) return prev;
              const reorderedModules = arrayMove(prev.modules, oldIndex, newIndex);
              return { ...prev, modules: reorderedModules.map((m, idx) => ({ ...m, moduleNumber: idx + 1 })) };
          });
      }
  };


  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full mb-6" /> {/* Placeholder for CourseForm */}
        <Skeleton className="h-8 w-1/4 mb-4" />
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full mb-4" />)}
        {/* Developed by Luccas A E | 2025 */}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Course Data</AlertTitle>
        <AlertDescription>{error.message} <Button variant="link" onClick={() => refetch()}>Try again</Button></AlertDescription>
      </Alert>
    );
  }

  if (!editedCourse) {
    return (
      <Alert className="m-6">
        <AlertTitle>Course Not Found</AlertTitle>
        <AlertDescription>The requested course could not be loaded or does not exist.</AlertDescription>
      </Alert>
    );
  }


  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl">Edit Course: {editedCourse.title}</CardTitle>
              <CardDescription>Manage course details, modules, and lessons.</CardDescription>
            </div>
            <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="course-published"
                        checked={editedCourse.isPublished}
                        onCheckedChange={toggleCoursePublishedStatus}
                        aria-label="Toggle course published status"
                    />
                    <Label htmlFor="course-published" className="flex items-center text-sm font-medium">
                        {editedCourse.isPublished ? <ShieldCheck className="mr-2 h-5 w-5 text-green-600" /> : <ShieldOff className="mr-2 h-5 w-5 text-gray-500" />}
                        {editedCourse.isPublished ? 'Published' : 'Draft'}
                    </Label>
                </div>
                <Button onClick={() => router.push(`/courses/${courseId}`)} variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" /> Preview Course
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CourseForm
            initialData={editedCourse} // Pass only relevant metadata
            onSubmit={async (formData) => {
              handleMetadataChange(formData);
              // Consider if metadata save should be separate or part of main "Save Course"
              // For now, updates local state, main save button persists all.
              toast({ title: "Metadata Updated (Locally)", description: "Course details updated. Click 'Save Course' to persist.", variant: "info" });
            }}
            isLoading={mutation.isLoading} // Form can show its own busy state if needed
          />
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl md:text-2xl">Modules & Lessons</CardTitle>
            <Button onClick={handleAddModule} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Module
            </Button>
          </div>
          <CardDescription>Organize course content into modules and lessons. Drag to reorder modules.</CardDescription>
        </CardHeader>
        <CardContent>
          {editedCourse.modules.length === 0 ? (
            <Alert variant="default" className="text-center">
                <AlertTitle>No Modules Yet</AlertTitle>
                <AlertDescription>Click "Add Module" to start building your course structure.</AlertDescription>
            </Alert>
          ) : (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={editedCourse.modules.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {editedCourse.modules.map((module, index) => (
                        <SortableModuleItem
                            key={module.id}
                            module={module}
                            moduleIndex={index}
                            courseId={courseId}
                            onModuleChange={handleModuleChange}
                            onDeleteModule={handleDeleteModule}
                            onAddLesson={handleAddLessonToModule}
                        />
                    ))}
                </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-end space-x-3 sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 rounded-t-lg border-t">
        <Button variant="outline" onClick={() => router.back()} disabled={mutation.isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSaveChanges} disabled={mutation.isLoading || isLoading} size="lg">
          {mutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Course
        </Button>
      </div>
      {/* Developed by Luccas A E | 2025 */}
    </div>
  );
};