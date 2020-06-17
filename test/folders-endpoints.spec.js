const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const supertest = require('supertest');
const foldersRouter = require('../src/folders/folders-router');
const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures');
const { makeNotesArray } = require('./notes.fixtures');
const { init } = require('../src/app');
const { DB_URL } = require('../src/config');


describe('Folders endpoints',() => {
    let db;
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        });
        app.set('db', db);
    });
    after('disconnect from db',() => db.destroy());
    before('Clean table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));
    afterEach('Clean up table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));

    describe('GET /api/folders',() => {
        context('Given no folders', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, []);
            });
        });

        context('Given an XSS attack folder', () => {
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder();
            const testNotes = makeNotesArray();

            beforeEach('insert folders', () => {
                return db 
                    .into('folders')
                    .insert([ maliciousFolder ])
            });

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/folders`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].folder_name).to.eql(expectedFolder.folder_name);
                    });
            });
        });

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();
            beforeEach('insert folders', () => {
                return db
                    .into('folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('notes')
                            .insert(testNotes)
                    });
            });
            it('Responds with 200 and all of the folders', () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders);
            });
        });
    });
    describe('GET /api/folders/:id', () => {
        context('Given no folders', () => {
            it('responds with 404', () => {
                const folderid = 23423;
                return supertest(app)
                    .get(`/api/folders/${folderid}`)
                    .expect(404, {error: {message: 'Folder does not exist'}});
            });
        });
        context('Given "folders" has data', () => {
            context('Given an XSS attack article', () => {
                const {maliciousFolder, expectedFolder} = makeMaliciousFolder();
                beforeEach('insert malicious folder', () => {
                    return db
                        .into('folders')
                        .insert(maliciousFolder);
                });
                it('removes XSS attack content', () => {
                    return supertest(app)
                        .get(`/api/folders/${maliciousFolder.id}`)
                        .expect(200)
                        .expect(res => {
                            expect(res.body.folder_name).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                        });
                });
            });
            const testFolders = makeFoldersArray();
            beforeEach('insert folders', () => {
                return db
                    .into('folders')
                    .insert(testFolders);
            });
            it('GET /api/folders/:id responds with 200 and the specified folder', () => {
                const folderid = 2;
                const expectedFolder = testFolders[folderid - 1];
                return supertest(app)
                    .get(`/api/folders/${folderid}`)
                    .expect(200, expectedFolder);
            });
        });
    });
    describe('POST /api/folders', () => {
        context('Given an XSS attack article', () => {
            const maliciousFolder = {
                id: 911,
                folder_name: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
            };
            beforeEach('insert malicious folder', () => {
                return db
                    .into('folders')
                    .insert([maliciousFolder]);
            });
            it('removes XSS attack content', () => {
                return supertest(app)
                    .post(`/api/folders`)
                    .send(maliciousFolder)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.folder_name).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    });
            });
        });
        it('creates a folder responding with 201 and the new folder', () => {
            const newFolder = {
                folder_name: "It's a new folder!",
            };
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(res => {
                    expect(res.body.folder_name).to.eql(newFolder.folder_name);
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/folders/${postRes.body.id}`)
                        .expect(postRes.body);
                });
        });
        it('responds with 400 and an error message when the name is missing', () => {
            return supertest(app)
                .post('/api/folders')
                .send({})
                .expect(400, {
                    error: {message: 'Missing folder_name in request body'}
                });
        });
    });
    describe('DELETE /api/folders/:id', () => {
        context('Given no folders', () => {
            it('responds with 404', () => {
                const folderid = 2342;
                return supertest(app)
                    .delete(`/api/folders/${folderid}`)
                    .expect(404, {error: {message: 'Folder does not exist'}});
            });
        });
        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray();
            beforeEach('insert folders', () => {
                return db
                    .into('folders')
                    .insert(testFolders);
            });
            it('responds with 204 and removes the article', () => {
                const idToRemove = 2;
                const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove);
                return supertest(app)
                    .delete(`/api/folders/${idToRemove}`)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get('/api/folders')
                            .expect(expectedFolders);
                    });
            });
        });
    });
    describe('PATCH /api/folders/:id', () => {
        context('Given no folders', () => {
            it('responds with 404', () => {
                const folderid = 2134;
                return supertest(app)
                    .patch(`/api/folders/${folderid}`)
                    .expect(404, {error: {message: 'Folder does not exist'}});
            });
        });
        context('Given folders in the database', () => {
            const testFolders = makeFoldersArray();
            beforeEach('insert folders', () => {
                return db
                    .into('folders')
                    .insert(testFolders);
            });
            it('responds with 204 and updates folder', () => {
                const idToUpdate = 2;
                const updateFolder = {
                    folder_name: 'Updated name',
                };
                const expectedFolder = {
                    ...testFolders[idToUpdate -1],
                    ...updateFolder
                };
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send(updateFolder)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/folders/${idToUpdate}`)
                            .expect(expectedFolder);
                    });    
            });
            it('responds with 400 when name is not supplied', () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send({ irrelevantField: 'foo'})
                    .expect(400, {
                        error: {message: 'Request body must contain folder_name'}
                    })
            })
        });
    });
});