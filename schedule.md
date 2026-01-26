# Schedule

## 1. Setup Phase
1. Create agent steering
2. Create agent hooks
   When saving a TypeScript file, check if the file contains usage documentation. If missing, add JSDoc-style documentation at the top of the file.
3. Add env variables

## 2. Planning Phase

Database design:

1. Define database schema and relationships.
2. Generate database creation scripts.
   Generate the data model in SQL for Supabase from the ERD diagram. Store it in the data-model directory, in a file called todo-app.sql
   list_role AS ENUM ('owner', 'editor', 'viewer');
   invitation_status AS ENUM ('pending', 'accepted', 'declined');
   todo_item_status AS ENUM ('pending', 'completed');
   (gen_random_uuid())

Project description:

1. Create a project description with objectives and scope.
2. Improve the project description based on feedback from AI.
   Can you review the following prompt and suggest areas where it should be improved. I want the prompt in EARS (Easy Application Requirements Syntax) format.
   Can you write the new improved prompt to a new file called "code_plan.md" in the planning directory

Project design:
1. Enter chat mode "Spec"
2. Paste prompt (or reference file)
3. Guide agent through reqs, design and tasks
4. Show requirements on-hover description

## 3. Implementation Phase
1. Start tasks
2. Verify output
3. x minutes later

7:04
1:36
0:44
1:49
3:28
1:23
3:50
1:17
4:38
3:06
4:02
2:56
4:28
4:00
3:58


## 4. Deployment Phase