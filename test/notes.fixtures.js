function makeNotesArray() {
    return [
        {
            id: 1,
            name: 'Note 1',
            content: 'Laborum laborum est aute est fugiat.',
            folders: 1
        },
        {
            id: 2,
            name: 'Note 2',
            content: 'Proident eiusmod aliquip ullamco non esse aute reprehenderit ea ex ullamco incididunt amet elit nisi.',
            folders: 2
        },
        {
            id: 3,
            name: 'Note 3',
            content: 'Nostrud occaecat dolor proident aliqua duis.',
            folders: 3
        }
    ];
}

function makeMaliciousNote() {
    const maliciousNote = {
        id: 911,
        name: 'Malicious note',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        folderId: 1
    };
    const expectedNote = {
        id: 911,
        name: 'Malicious note',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        folderId: 1
    };

    return {
        maliciousNote,
        expectedNote
    };
}

module.exports = {
    makeNotesArray,
    makeMaliciousNote
};