-- Active: 1676000213886@@127.0.0.1@3306

-- TABLE users
-- query a
DROP TABLE users;

-- query b
CREATE TABLE users(
    id TEXT PRIMARY KEY UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- query c
INSERT INTO users (id, name, email, password, role, created_at) VALUES
    ("u001", "John Titor", "johntitor@gmail.com", "passw0rd", "author", "2022-06-03T11:45:23Z"),
    ("u002", "Carl Donovan", "carldonovan@gmail.com", "passw1rd", "admin", "2023-01-17T09:32:12Z"),
    ("u003", "Julia Schmidt", "juliaschmidt@gmail.com", "passw1rd", "author", "2022-07-03T11:45:23Z"),
    ("u004", "Alice Grassi", "alicegrassi@gmail.com", "pasZw0rd", "author", "2022-06-02T11:45:23Z");

-- query d
SELECT * FROM users;

-- TABLE posts
-- query e
DROP TABLE posts;

-- query f
CREATE TABLE posts (
    id TEXT PRIMARY KEY UNIQUE NOT NULL,
    creator_id TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT(0),
    dislikes INTEGER DEFAULT(0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- query g
INSERT INTO posts(id, creator_id, content, created_at, updated_at) VALUES 
    ("post001", "u001", "Hello World!", "2022-06-03T11:45:23Z", "2022-06-03T11:45:23Z"),
    ("post002", "u003", "I'm going to watch a movie.", "2022-07-03T11:45:23Z", "2022-07-03T11:45:23Z"),
    ("post003", "u004", "LOL! I fried an egg.", "2022-08-03T11:45:23Z", "2022-08-03T11:45:23Z");

-- query h
SELECT * FROM posts;

-- TABLE likes_dislikes
-- query i
DROP TABLE likes_dislikes;

-- query j
CREATE TABLE likes_dislikes (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    like INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES post(id)
);

-- query k
INSERT INTO likes_dislikes VALUES 
    ("u001", "post003", 1),
    ("u003", "post004", 1);

-- query l
SELECT * FROM likes_dislikes;

