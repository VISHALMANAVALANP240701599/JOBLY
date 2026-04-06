# JOBLY Task Tracker

## 1. Project Setup & Planning
- [x] Review existing codebase
- [x] Finalize implementation plan and get user approval

## 2. Backend Initialization & Config
- [/] Initialize `backend` directory with `package.json`
- [/] Install dependencies (express, mongoose, bcrypt, jsonwebtoken, cors, dotenv, multer)
- [ ] Set up `server.js` and connect to MongoDB

## 3. Database Models (MongoDB)
- [ ] Create User Model (`User.js`)
- [ ] Create Job Model (`Job.js`)
- [ ] Create Application Model (`Application.js`)

## 4. Backend Authentication APIs
- [ ] Implement `POST /api/signup` (with bcrypt)
- [ ] Implement `POST /api/login` (with JWT)
- [ ] Create auth middleware (`verifyToken`, `checkRole`)

## 5. Backend Job APIs
- [ ] Implement `POST /api/jobs` (Recruiter only)
- [ ] Implement `GET /api/jobs` (All users)
- [ ] Implement `PUT /api/jobs/:id` (Recruiter only)
- [ ] Implement `DELETE /api/jobs/:id` (Recruiter only)

## 6. Backend Application APIs
- [ ] Implement `POST /api/apply` (Seeker only)
- [ ] Implement `GET /api/applications` (Recruiter & Seeker specific)

## 7. Frontend Refactoring & Integration
- [ ] Move existing HTML/CSS/JS to `frontend` folder
- [ ] Update [auth.js](file:///c:/Users/visha/OneDrive/Documents/jobly/auth.js) to call real backend signup/login APIs
- [ ] Update dashboard scripts to fetch data from APIs instead of `localStorage`
- [ ] Implement UI for file upload (certificates)
- [ ] Ensure smooth routing and token management

## 8. Final Polish & Verification
- [ ] Test end-to-end flows
- [ ] Refine UI/UX elements
- [ ] Present walkthrough to the user
