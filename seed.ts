
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Directory containing course data files
  const dataDir = path.join(__dirname, '..', 'src', 'data', 'courses');
  
  // Check if directory exists before reading it
  if (!fs.existsSync(dataDir)) {
    console.log(`Data directory not found: ${dataDir}`);
    console.log('Make sure you have course data files in src/data/courses/');
    return;
  }

  // Get list of course data files
  const files = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  if (files.length === 0) {
    console.log('No course data files found.');
    return;
  }

  console.log(`Found ${files.length} course data files.`);

  // Import and process each course
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`Processing ${filePath}...`);

    try {
      // Dynamic import of the course data
      const courseModule = await import(filePath);
      const courseData = courseModule.default;

      if (!courseData || !courseData.course) {
        console.log(`Invalid course data in ${file}`);
        continue;
      }

      const { course, modules } = courseData;

      // Create or update the course
      const existingCourse = await prisma.course.findUnique({
        where: { courseAcronym: course.courseAcronym },
      });

      let courseRecord;
      if (existingCourse) {
        console.log(`Updating existing course: ${course.title}`);
        courseRecord = await prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            title: course.title,
            description: course.description,
            price: course.price,
            moduleCount: modules.length,
            lessonCount: modules.reduce((count, module) => count + module.lessons.length, 0),
          },
        });
      } else {
        console.log(`Creating new course: ${course.title}`);
        courseRecord = await prisma.course.create({
          data: {
            title: course.title,
            description: course.description,
            courseAcronym: course.courseAcronym,
            price: course.price,
            moduleCount: modules.length,
            lessonCount: modules.reduce((count, module) => count + module.lessons.length, 0),
          },
        });
      }

      // Process each module
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const moduleData = modules[moduleIndex];

        // Create or update module
        const existingModule = await prisma.module.findFirst({
          where: {
            courseId: courseRecord.id,
            moduleNumber: moduleIndex + 1,
          },
        });

        let moduleRecord;
        if (existingModule) {
          console.log(`Updating existing module: ${moduleData.title}`);
          moduleRecord = await prisma.module.update({
            where: { id: existingModule.id },
            data: {
              title: moduleData.title,
              description: moduleData.description,
            },
          });
        } else {
          console.log(`Creating new module: ${moduleData.title}`);
          moduleRecord = await prisma.module.create({
            data: {
              title: moduleData.title,
              description: moduleData.description,
              moduleNumber: moduleIndex + 1,
              courseId: courseRecord.id,
            },
          });
        }

        // Process each lesson
        for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex++) {
          const lessonData = moduleData.lessons[lessonIndex];

          // Create or update lesson
          const existingLesson = await prisma.lesson.findFirst({
            where: {
              moduleId: moduleRecord.id,
              lessonNumber: lessonIndex + 1,
            },
          });

          if (existingLesson) {
            console.log(`Updating existing lesson: ${lessonData.title}`);
            await prisma.lesson.update({
              where: { id: existingLesson.id },
              data: {
                title: lessonData.title,
                overview: lessonData.overview,
                content: lessonData.content,
                keywords: lessonData.keywords || [],
              },
            });
          } else {
            console.log(`Creating new lesson: ${lessonData.title}`);
            await prisma.lesson.create({
              data: {
                title: lessonData.title,
                overview: lessonData.overview,
                content: lessonData.content,
                keywords: lessonData.keywords || [],
                lessonNumber: lessonIndex + 1,
                moduleId: moduleRecord.id,
                courseId: courseRecord.id,
              },
            });
          }
        }
      }

      // Create exam questions if included in the course data
      if (courseData.examQuestions && courseData.examQuestions.length > 0) {
        console.log(`Processing ${courseData.examQuestions.length} exam questions...`);
        
        // First, remove existing questions to avoid duplicates
        await prisma.examQuestion.deleteMany({
          where: { courseId: courseRecord.id },
        });
        
        // Create new questions
        for (const question of courseData.examQuestions) {
          await prisma.examQuestion.create({
            data: {
              questionText: question.questionText,
              optionA: question.optionA,
              optionB: question.optionB,
              optionC: question.optionC,
              optionD: question.optionD,
              correctOption: question.correctOption,
              courseId: courseRecord.id,
            },
          });
        }
      }

      console.log(`Completed processing ${file}`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log('Database seeding completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
