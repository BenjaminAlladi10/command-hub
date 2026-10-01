# AI Notes

AI tools were used during the development of Command Hub as development assistants.

## How AI Was Used

AI assistance was used for:

* Project structure and backend architecture suggestions
* Express.js and Node.js implementation guidance
* Prisma schema design and database relationships
* Discord Interactions API implementation guidance
* Discord Ed25519 signature verification
* Authentication and session-management implementation
* Error handling and API response structure
* Retry and failure-handling logic
* Reviewing code for potential issues and edge cases
* README and API documentation preparation
* Debugging implementation issues during local testing

## Human Verification

All generated suggestions and code were reviewed and adapted manually.

The application was tested locally by:

* Running the Express server
* Connecting the Discord application
* Registering and testing slash commands
* Sending `/hello` and `/notify` commands
* Verifying Discord interaction responses
* Testing command configuration and keyword rules
* Testing mirror notifications
* Testing mirror failure handling
* Testing retry behavior
* Testing authentication endpoints
* Verifying database records using Prisma Studio/PostgreSQL

AI-generated code was treated as development assistance rather than as unverified final implementation.

## AI Limitations

AI assistance may provide incorrect or outdated information, particularly around external APIs and platform-specific behavior. Discord API behavior, security-sensitive functionality, database operations, and authentication logic were therefore verified through implementation and testing before being included in the project.

## Tools Used

### Cursor

Used extensively for backend development, including:

* Node.js and Express backend APIs
* Prisma models and database integration
* Discord interaction handling
* Authentication and session management
* Command rules and configuration
* Retry and failure handling
* API implementation and code organization
* Backend debugging and refactoring

### Lovable

Used for the frontend/dashboard UI, including:

* React UI
* Dashboard layouts and components
* User interface design
* Frontend interaction flows

### ChatGPT and Claude

Used for:

* System architecture
* Implementation guidance
* Technical explanations
* Debugging
* Reviewing implementation decisions
* Identifying edge cases
* Documentation
* README and API documentation
* Development workflow guidance

### Official Documentation

The following official documentation was used to verify implementation details:

* Discord API documentation — interactions, webhooks, slash commands, and request verification
* Prisma documentation — ORM, schema design, migrations, and PostgreSQL integration
* PostgreSQL documentation — database concepts and configuration
