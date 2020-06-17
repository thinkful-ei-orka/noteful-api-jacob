const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const supertest = require('supertest');
const notesRouter = require('../src/notes/notes-router');
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures');

const { makeFoldersArray } = require('./folders.fixtures');


describe('Notes endpoints', () => {
    let db;
    before('make knex instance', () => {

        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        });
        app.set('db', db);
    });
    after('disconnect from db', () => db.destroy());
    before('Clean table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));
    afterEach('Clean up table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));
    describe('GET /api/notes/:id', () => {
        context('given no notes', () => {
            it('responds with 404', () => {
                const noteId = 234;
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(404, {error: 
                    {message: 'Note does not exist'}});
            });
        });
        context('given notes', () => {
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();
            beforeEach('insert folders', () => {
                return db
                    .into('folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('notes')
                            .insert(testNotes);
                    });
            });

            it('responds with 200 and the specified note', () => {
                const noteId = 1;
                const expectedNote = testNotes[noteId - 1];
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(200, expectedNote);
            });
        });
    });
    describe('POST /api/notes', () => {
        beforeEach('insert folders', () => {
            const testFolders = makeFoldersArray();
            return db  
                .into('folders')
                .insert(testFolders);
        });
        it('creates a note, responding with 201 and the new note', () => {
            const newNote = {
                note_name: 'New note!',
                content: 'Mollit reprehenderit veniam magna velit.',
                folderid: 1
            };
            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .expect(201)
                .expect(res => {
                    expect(res.body.note_name).to.eql(newNote.note_name);
                    expect(res.body.content).to.eql(newNote.content);
                    expect(res.body.folderid).to.eql(newNote.folderid);
                })
                .then(res => {
                    supertest(app)
                        .get(`/api/notes/${res.body.id}`)
                        .expect(res.body);
                });
        });
    });
    describe('DELETE /api/notes/:id', () => {
        context('Given no notes', () => {
            it('responds with 404', () => {
                const noteId = 2134;
                return supertest(app)
                    .delete(`/api/notes/${noteId}`)
                    .expect(404, {error: { message: 'Note does not exist'}});
            });
        });
        context('Given notes in the database', () => {
            const testNotes = makeNotesArray();
            const testFolders = makeFoldersArray();
            beforeEach('insert folers and notes', () => {
                return db
                    .into('folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('notes')
                            .insert(testNotes);
                    });
            });
            it('responds with 204 and removes note', () => {
                const idToRemove = 2;
                const expectedNotes = testNotes.filter(note => note.id !== idToRemove);
                return supertest(app)
                    .delete(`/api/notes/${idToRemove}`)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/notes/${idToRemove}`)
                            .expect(404, {error: { message: 'Note does not exist'}});
                    });
            });
        });
    });

    describe('PATCH /api/notes/:id', () => {
        context('given no notes', () => {
            it('responds with 404',() => {
                const noteId = 123;
                return supertest(app)
                    .patch(`/api/notes/${noteId}`)
                    .expect(404, { error: { message: 'Note does not exist' }});
            });
        });
        context('Given notes in the database', () => {
            const testNotes = makeNotesArray();
            const testFolders = makeFoldersArray();

            beforeEach('insert notes', () => {
                return db
                    .into('folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('notes')
                            .insert(testNotes);
                    });
            });

            it('responds with 204 and updates the note', () => {
                const idToUpdate = 2;
                const updateNote = {
                    note_name: 'OMG NEW NAME',
                    content: 'Wait.. where is the lorem?!',
                    folderid: 3
                };
                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                };
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send(updateNote)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .expect(expectedNote)
                    );
            });

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                  .patch(`/api/notes/${idToUpdate}`)
                  .send({ irrelevantField: 'foo' })
                  .expect(400, {
                    error: {
                      message: 'Request body must contain note_name, content, and folderid'
                    }
                  })
            })
            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateNote = {
                  note_name: 'updated note name',
                }
                const expectedArticle = {
                  ...testNotes[idToUpdate - 1],
                  ...updateNote
                }
        
                return supertest(app)
                  .patch(`/api/notes/${idToUpdate}`)
                  .send({
                    ...updateNote,
                    fieldToIgnore: 'should not be in GET response'
                  })
                  .expect(204)
                  .then(res =>
                    supertest(app)
                      .get(`/api/notes/${idToUpdate}`)
                      .expect(expectedArticle)
                  )
              })
        });
    });
});