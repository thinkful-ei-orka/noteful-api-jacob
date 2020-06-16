const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const supertest = require('supertest');
const notesRouter = require('../src/notes/notes-router');
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures');