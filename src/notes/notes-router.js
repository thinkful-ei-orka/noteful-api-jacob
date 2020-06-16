const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');
const FoldersService = require('../folders/folders-service');
const { serialize } = require('v8');
const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
    id: note.id,
    name: xss(note.name),
    content: xss(note.content),
    folders: note.folders
});

notesRouter
    .route('/')
    .post(jsonParser, (req, res, next) => {
        const { name, content, folders } = req.body;
        const newNote = { name, content, folders };
        for (const [key, value] of Object.entries(newNote)) {
            if (value === null) {
                return res.status(400).json({
                    error: {message: `Missing '${key}' in request body`}
                });
            }
        }
        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
            .then(note  => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.id}`))
                    .json(serializeNote(note));
            })
            .catch(next);
    });

notesRouter
    .route('/:id')
    .all((req, res, next) => {
        NotesService.getById(
            req.app.get('db'),
            req.params.id
        )
            .then(note => {
                if(!note) {
                    return res.status(404).json({
                        error: {message: 'Note does not exist'}
                    });
                }
                res.note = note;
                next();
            })
            .catch(next);
    })
    .get((req, res, next) => {
        res.json(serializeNote(res.note));
    })
    .delete((req, res, next) => {
        NotesService.deleteNote(
            req.app.get('db'),
            req.params.id
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const {name, content, folders} = req.body;
        const noteToUpdate = { name, content, folders };
        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
        if(numberOfValues === 0)
            return res.status(400).json({
                error: {
                    message: 'Request body must contain name, content, and folders'
                }
            });
        NotesService.updateNote(
            req.app.get('db'),
            req.params.id,
            noteToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = notesRouter;