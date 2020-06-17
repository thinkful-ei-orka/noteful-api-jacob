require('dotenv').config();
const knex = require('knex');
const FoldersService = require('./folders/folders-service');
const knexInstance = knex({
    client: 'pg',
    connection: process.env.DB_URL,
});

FoldersService.getAllFolders(knexInstance)
    .then(folders => console.log(folders))
    .then(() => FoldersService.insertFolder(knexInstance, {
        folder_name: 'inserted a new folder!'
    })
    )
    .then(newFolder => {
        console.log(newFolder);
        return FoldersService.updateFolder(
            knexInstance, 
            newFolder.id, 
            {folder_name: 'updated again!'}
        );
    })
    .then(folder => {
        console.log(folder);
        return FoldersService.deleteFolder(knexInstance,folder.id);
    });
console.log(FoldersService.getAllFolders());