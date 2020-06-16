const path = require('path');
const express = require('express');
const xss = require('xss');
const FoldersService = require('./folders-service');
const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name)
});

foldersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        FoldersService.getAllFolders(knexInstance)
            .then(folders => {
                res.json(folders.map(serializeFolder));
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { name } = req.body;
        const newFolder = { name };
        if(!name) {
            return res
                .status(400)
                .json({error: {message: 'Missing name in request body'}});
        }
        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(`/api/folders/${folder.id}`))
                    .json({
                        id: folder.id,
                        name: xss(folder.name)});
            })
            .catch(next);
    });

foldersRouter
    .route('/:id')
    .all((req, res, next) => {
        FoldersService.getById(req.app.get('db'), req.params.id)
            .then(folder => {
                if(!folder) {
                    return res.status(404).json({
                        error: {message: 'Folder does not exist'}
                    });
                }
                res.folder = folder;
                next();
            });
    })
    .get((req,res,next) => {
        res.json({
            id: res.folder.id,
            name: xss(res.folder.name),
        });
    })
    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.id
        )
            .then(() => {
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { name } = req.body;
        const folderToUpdate = {name};
        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {message: 'Request body must contain name'}
            });
        }
        FoldersService.updateFolder(
            req.app.get('db'),
            req.params.id,
            folderToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = foldersRouter;