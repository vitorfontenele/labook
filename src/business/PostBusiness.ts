import { LikesDislikesDatabase } from "../database/LikesDislikesDatabase";
import { PostDatabase } from "../database/PostDatabase";
import { UserDatabase } from "../database/UserDatabase";
import { CreatePostInputDTO, DeletePostInputDTO, EditPostInputDTO, EditPostLikesInputDTO, GetPostByIdInputDTO, GetPostInputDTO, GetPostOutputDTO, PostDTO } from "../dtos/PostDTO";
import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { LikesDislikes } from "../models/LikesDislikes";
import { Post } from "../models/Post";
import { LikesDislikesDB, UserDB, USER_ROLES } from "../types";
import { IdGenerator } from "../services/IdGenerator";
import { TokenManager } from "../services/TokenManager";
import { ForbidenError } from "../errors/ForbiddenError";

export class PostBusiness {
    constructor(
        private postDatabase : PostDatabase,
        private userDatabase : UserDatabase,
        private likesDislikesDatabase : LikesDislikesDatabase,
        private postDTO : PostDTO,
        private idGenerator : IdGenerator,
        private tokenManager: TokenManager
    ){}

    public async getPosts(input: GetPostInputDTO) : Promise<GetPostOutputDTO[]>{
        const { token } = input;

        const payload = this.tokenManager.getPayload(token);
        if (payload === null){
            throw new BadRequestError("Token inválido");
        }

        const postsDB = await this.postDatabase.findPosts();
        const usersDB = await this.userDatabase.findUsers();

        const output = postsDB.map(postDB => {
            const post = new Post (
                postDB.id,
                postDB.content,
                postDB.likes,
                postDB.dislikes,
                postDB.created_at,
                postDB.updated_at,
                getCreator(postDB.creator_id)
            );

            return this.postDTO.getPostOutput(post);
        })             

        function getCreator(userId : string){
            const user = usersDB.find(userDB => userDB.id === userId) as UserDB;

            return {
                id: user.id,
                name: user.name
            }
        }

        return output;
    }

    public async getPostById(input: GetPostByIdInputDTO) : Promise<GetPostOutputDTO>{
        const { id , token } = input;

        const payload = this.tokenManager.getPayload(token);
        if (payload === null){
            throw new BadRequestError("Token inválido");
        }

        const postDB = await this.postDatabase.findPostById(id);
        if (!postDB){
            throw new NotFoundError("Não foi encontrado um post com esse 'id'");
        }

        const userId = postDB.creator_id;
        const userDB = await this.userDatabase.findUserById(userId);
        const userName = userDB?.name;

        const post = new Post(
            postDB.id,
            postDB.content,
            postDB.likes,
            postDB.dislikes,
            postDB.created_at,
            postDB.updated_at,
            { 
              id: userId, 
              name: userName as string
            }
        )

        const output = this.postDTO.getPostOutput(post);

        return output;
    }

    public async createPost(input : CreatePostInputDTO) : Promise<void>{
        const { content , token } = input;

        const payload = this.tokenManager.getPayload(token);
        if (payload === null){
            throw new BadRequestError("Token inválido");
        }

        const id = this.idGenerator.generate();
        const createdAt = (new Date()).toISOString();
        const likes = 0;
        const dislikes = 0;

        const newPost = new Post (
            id,
            content,
            likes,
            dislikes,
            createdAt,
            createdAt,
            {
                id: payload.id, 
                name: payload.name
            }
        )

        const newPostDB = newPost.toDBModel();
        await this.postDatabase.createPost(newPostDB);
    }

    public async updatePostById(input : EditPostInputDTO) : Promise<void>{
        const { content , id , token } = input;

        const payload = this.tokenManager.getPayload(token);
        if (payload === null){
            throw new BadRequestError("Token inválido");
        }

        const postDB = await this.postDatabase.findPostById(id);
        if (!postDB){
            throw new NotFoundError("Não foi encontrado um post com esse id");
        }

        if (payload.id !== postDB.creator_id){
            throw new ForbidenError("Somente quem criou o post pode editá-lo");
        }

        const updatedAt = (new Date()).toISOString();

        const updatedPost = new Post(
            id,
            content,
            postDB.likes,
            postDB.dislikes,
            postDB.created_at,
            updatedAt,
            {
                id: postDB.creator_id,
                name: "" // não fará diferença
            }
        )

        const updatedPostDB = updatedPost.toDBModel();
        await this.postDatabase.updatePostById(updatedPostDB, id);
    }

    public async updatePostLikesById(input : EditPostLikesInputDTO) : Promise<void>{
        const { id , token } = input;
        const updatedLike = input.like;

        const payload = this.tokenManager.getPayload(token);
        if (payload === null){
            throw new BadRequestError("Token inválido");
        } 

        // user que deu like/dislike, não o autor do post!
        const userId = payload.id;

        const postDB = await this.postDatabase.findPostById(id);
        if (!postDB){
            throw new NotFoundError("Não foi encontrado um post com esse 'id'");
        }

        const postId = postDB.id as string;

        if (postDB.creator_id === userId){
            throw new BadRequestError("Usuário não pode dar dislike/like no próprio post");
        }

        const likesDislikesDB = await this.likesDislikesDatabase.findLikeByUserAndPostId(userId, postId);

        let deltaLikes = 0;
        let deltaDislikes = 0;

        if (!likesDislikesDB){
            // Caso nao exista nem like nem dislike do user no post
            const newLikesDislikes = new LikesDislikes(userId, postId);

            if (updatedLike){
                // caso seja dado o like
                newLikesDislikes.setLike(1);
                deltaLikes = 1;
            } else {
                // caso seja dado dislike
                newLikesDislikes.setLike(0);
                deltaDislikes = 1;
            }

            const newLikesDislikesDB : LikesDislikesDB = {
                user_id : newLikesDislikes.getUserId(),
                post_id : newLikesDislikes.getPostId(),
                like : newLikesDislikes.getLike()
            }

            await this.likesDislikesDatabase.createLike(newLikesDislikesDB);
        } else {
            // Caso já exista um like ou dislike do user no post
            const like = likesDislikesDB.like;

            if ((updatedLike === Boolean(like))){
                // Usuário dá like num post que já havia dado like
                // ou dá dislike num post que já havia dado dislike
                await this.likesDislikesDatabase.deleteLikeByUserAndPostId(userId, postId);

                if (updatedLike){
                    // -1 like
                    deltaLikes = -1;
                } else {
                    // -1 dislike
                    deltaDislikes = -1;
                }

            } else {
                // Usuário dá like num post que já havia dado dislike
                // ou dá dislike num post que já havia dado like
                const updatedLike = Number(!like);
                const updatedLikesDislikes = new LikesDislikes(userId, postId, updatedLike);

                const updatedLikesDislikesDB : LikesDislikesDB = {
                    user_id: updatedLikesDislikes.getUserId(),
                    post_id: updatedLikesDislikes.getPostId(),
                    like: updatedLikesDislikes.getLike()
                }

                await this.likesDislikesDatabase.updateLikeByUserAndPostId(
                    updatedLikesDislikesDB,
                    userId,
                    postId
                );

                deltaLikes = updatedLike ? 1 : -1;
                deltaDislikes = updatedLike ? -1 : 1;
            }
        }

        const updatedPost = new Post(
            postId,
            postDB.content,
            postDB.likes + deltaLikes,
            postDB.dislikes + deltaDislikes,
            postDB.created_at,
            postDB.updated_at,
            {
                id: postDB.creator_id,
                name: "" // não fará diferença
            }
        )

        const updatedPostDB = updatedPost.toDBModel();
        await this.postDatabase.updatePostById(updatedPostDB, postId);
    }

    public async deletePostById(input: DeletePostInputDTO) : Promise<void>{
        const { id , token } = input;

        const payload = this.tokenManager.getPayload(token);
        if (payload === null){
            throw new BadRequestError("Token inválido");
        }        

        const postDB = await this.postDatabase.findPostById(id);
        if (!postDB){
            throw new NotFoundError("Não existe um post com esse 'id'");
        }

        if (payload.role !== USER_ROLES.ADMIN && (postDB.creator_id !== payload.id)){
            throw new ForbidenError("Você não tem permissão para realizar essa ação");
        }

        const likesDislikesDB = await this.likesDislikesDatabase.findLikesByPostId(id);
        if (likesDislikesDB.length > 0){
            await this.likesDislikesDatabase.deleteLikesByPostId(id);
        }
        await this.postDatabase.deletePostById(id);
    }
}