# Schedule
Install Kiro
Install kiro-cli (curl -fsSL https://cli.kiro.dev/install | bash)
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
   Show requirements on-hover description

## 3. Implementation Phase
1. Start tasks
2. Verify output
3. 48 minutes later

## 4. Deployment Phase
1. Supabase migration
   Now lets create a migration for supabase
2. Create "DevOps agent" for deployment using Terraform
   /agent create --name devops
   /agent swap devops
3. Prompt Agent to deploy
   Using the Azure MCP server for the latest doc updates, review this application and update so that it can:
   - I want the simplest deployment, with basic capacity and a public URL that I can access anywhere on the web
   - Use the Terraform MCP server to generate IaC
   - Deploy App to Azure
4. Now deploy to Sonat Playground


   You are a Senior DevOps Engineer and Solutions Developer with expertise in Terraform, TypeScript, Bash scripting, and Azure Cloud Services. Using terraform, deploy appropriate services to host the web app in azure servers