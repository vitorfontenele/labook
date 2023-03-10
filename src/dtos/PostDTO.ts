import { BadRequestError } from "../errors/BadRequestError";
import { Post } from "../models/Post";

export interface CreatePostInputDTO {
    content : string
    token: string
}

export interface EditPostInputDTO {
    id : string
    content : string
    token: string
}

export interface EditPostLikesInputDTO {
    id : string
    like : boolean
    token: string
}

export interface GetPostInputDTO {
    token: string
}

export interface GetPostOutputDTO {
    id : string
    content : string
    likes: number
    dislikes: number
    createdAt: string
    updatedAt: string
    creator: {
        id: string,
        name: string
    }
}

export interface GetPostByIdInputDTO {
    id: string
    token: string
}

export interface DeletePostInputDTO{
    id: string
    token: string
}

export class PostDTO {
    getPostInput = (token: unknown) : GetPostInputDTO => {
        if (typeof token !== "string"){
            throw new BadRequestError ("Token inválido");
        }

        const result : GetPostInputDTO = {
            token
        }

        return result;
    }

    getPostOutput = (post: Post) : GetPostOutputDTO => {
        const result : GetPostOutputDTO = {
            id: post.getId(),
            content: post.getContent(),
            likes: post.getLikes(),
            dislikes: post.getDislikes(),
            createdAt: post.getCreatedAt(),
            updatedAt: post.getCreatedAt(),
            creator: post.getCreator()
        }
        
        return result;
    }

    getPostByIdInput = (token: unknown, id: string) : GetPostByIdInputDTO => {
        // id é path param
        
        if (typeof token !== "string"){
            throw new BadRequestError ("Token inválido");
        }

        const result : GetPostByIdInputDTO = {
            id,
            token
        }

        return result;
    }

    createPostInput = (content: unknown, token: unknown) : CreatePostInputDTO => {
        if (typeof content !== "string"){
            throw new BadRequestError("'content' deve ser uma string");
        }

        if (typeof token !== "string"){
            throw new BadRequestError("Token inválido");
        }

        const result : CreatePostInputDTO = {
            content,
            token
        }

        return result;
    }

    editPostInput = (id : string, content : unknown, token: unknown) : EditPostInputDTO => {
        // id é string pois path param
        
        if (typeof content !== "string"){
            throw new BadRequestError("'content' deve ser uma string");
        }
        if (typeof token !== "string"){
            throw new BadRequestError("Token inválido");
        }

        const result : EditPostInputDTO = {
            id,
            content,
            token
        }

        return result;
    }

    editPostLikesInput = (id : string, like : unknown, token: unknown) : EditPostLikesInputDTO => {
        // id é string pois path param
        
        if (typeof like !== "boolean"){
            throw new BadRequestError("'like' deve ser um boolean");
        }
        if (typeof token !== "string"){
            throw new BadRequestError("Token inválido");
        }

        const result : EditPostLikesInputDTO = {
            id,
            like,
            token
        }

        return result;
    }

    deletePostInput = (id: string, token: unknown) : DeletePostInputDTO => {
        // id é string pois path param
        if (typeof token !== "string"){
            throw new BadRequestError("Token inválido");
        }

        const result : DeletePostInputDTO = {
            id,
            token
        }

        return result;
    }
}