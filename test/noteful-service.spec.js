const { expect } = require("chai");
const knex = require('knex');
const FoldersService = require('../src/folders/folders-service');
const { makeFoldersArray } = require("./folders.fixtures");



describe('Folders-service object', () => {
    let db;
    let testFolders = makeFoldersArray();
    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        });
    });
    before('Clean table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));
    afterEach('Clean up table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));
    after(() => db.destroy());

    describe('getAllFolders()',() => {
        context('Given "folders" has data', () => {
            beforeEach(() => {
                return db
                    .into('folders')
                    .insert(testFolders);
            });
            it('Resolves all folders from "noteful"', () => {
                return FoldersService.getAllFolders(db)
                    .then(actual => {
                        expect(actual).to.eql(testFolders);
                    });
            });
        });
        context('Given "folders" has no data', () => {
            it('getAllFolders() resolves an empty array', () => {
                return FoldersService.getAllFolders(db)
                    .then(actual => {
                        expect(actual).to.eql([]);
                    });
            });
        });
    });
    describe('insertFolder()', () => {
        context('given "folders" has no data', () => {

            it('inserts a new folder and resolves the new folder with an id', () => {
                const newFolder = {folder_name: 'new folder name'};
                return FoldersService.insertFolder(db, newFolder)
                    .then(actual => {
                        expect(actual).to.eql({
                            id: 1,
                            folder_name: 'new folder name'
                        });
                    });
            });
        });
    });
    describe('getById()', () => {
        context('Given "folders" has data', () => {
            beforeEach(() => {
                return db
                    .into('folders')
                    .insert(testFolders);
            });
            it('resolves a folder by id from "folders"', () => {
                const thirdId = 3;
                const thirdTestFolder = testFolders[thirdId - 1];
                return FoldersService.getById(db, thirdId)
                    .then(actual => {
                        expect(actual).to.eql({
                            id: thirdId,
                            folder_name: 'Third test'
                        });
                    });
            });
        });
    });
    describe('DeleteFolder()',() => {
        context('Given "folders" has data', () => {
            beforeEach(() => {
                return db
                    .into('folders')
                    .insert(testFolders);
            });
            it('deleteFolders() removes a folder by id from "folders"', () => {
                const folderid = 3;
                return FoldersService.deleteFolder(db, folderid)
                    .then(() => FoldersService.getAllFolders(db))
                    .then(allFolders => {
                        const expected = testFolders.filter(folder => folder.id !== folderid);
                        expect(allFolders).to.eql(expected);
                    });
            });
        });
    });
    describe('updateFolder()', () => {
        context('Given "folders" has data', () => {
            beforeEach(() => {
                return db
                    .into('folders')
                    .insert(testFolders);
            });
            it('Updates a folder name in "folders" by id', () => {
                const idOfUpdateFolder = 3;
                const newFolderData = {
                    folder_name: 'new name'
                };
                return FoldersService.updateFolder(db, idOfUpdateFolder, newFolderData)
                    .then(() => {
                        return FoldersService.getById(db, idOfUpdateFolder);
                    })
                    .then(article => {
                        expect(article).to.eql({
                            id: idOfUpdateFolder,
                            ...newFolderData,
                        })
                    })
            });
        });
    });
});