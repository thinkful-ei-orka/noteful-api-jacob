TRUNCATE folders, notes RESTART IDENTITY CASCADE;

INSERT INTO folders (folder_name) 
VALUES
('Hello'),
('Goodbye'),
('Last folder');

INSERT INTO notes (note_name, content, folderid)
VALUES 
('note 1', 'Esse duis deserunt commodo esse et incididunt ad in et.', 1),
('note 2', 'Irure ex laboris voluptate non veniam minim cupidatat veniam incididunt officia.', 2),
('note 3', 'Enim aliquip amet et sint deserunt nisi nisi adipisicing nisi dolore labore ad sit esse.', 3);