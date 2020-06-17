function makeNotesArray() {
    return [
        {
            id: 1,
            note_name: 'Note 1',
            content: 'Laborum laborum est aute est fugiat.',
            folderid: 1
        },
        {
            id: 2,
            note_name: 'Note 2',
            content: 'Proident eiusmod aliquip ullamco non esse aute reprehenderit ea ex ullamco incididunt amet elit nisi.',
            folderid: 2
        },
        {
            id: 3,
            note_name: 'Note 3',
            content: 'Nostrud occaecat dolor proident aliqua duis.',
            folderid: 3
        }
    ];
}

function makeMaliciousNote() {
    const maliciousNote = {
        id: 911,
        note_name: 'Malicious note',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        folderid: 1
    };
    const expectedNote = {
        id: 911,
        note_name: 'Malicious note',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        folderid: 1
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