import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsPost, NewsStatus } from './entities/news-post.entity.js';
import { CreateNewsPostDto, PublishNewsPostDto, UpdateNewsPostDto } from './dto/news-post.dto.js';

@Injectable()
export class NewsPostsService {
  constructor(@InjectRepository(NewsPost) private readonly newsRepo: Repository<NewsPost>) {}

  create(dto: CreateNewsPostDto, authorUserId: string): Promise<NewsPost> {
    return this.newsRepo.save(this.newsRepo.create({ ...dto, authorUserId, status: NewsStatus.DRAFT }));
  }

  async update(id: string, dto: UpdateNewsPostDto): Promise<NewsPost> {
    const post = await this.findByIdOrFail(id);
    Object.assign(post, dto);
    return this.newsRepo.save(post);
  }

  async setStatus(id: string, dto: PublishNewsPostDto): Promise<NewsPost> {
    const post = await this.findByIdOrFail(id);
    post.status = dto.status;
    if (dto.status === NewsStatus.PUBLISHED) {
      post.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : new Date();
    }
    return this.newsRepo.save(post);
  }

  findAllForStaff(): Promise<NewsPost[]> {
    return this.newsRepo.find({ order: { createdAt: 'DESC' } });
  }

  findPublished(): Promise<NewsPost[]> {
    return this.newsRepo.find({
      where: { status: NewsStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
    });
  }

  async findPublishedByIdOrFail(id: string): Promise<NewsPost> {
    const post = await this.newsRepo.findOne({ where: { id, status: NewsStatus.PUBLISHED } });
    if (!post) throw new NotFoundException('News post not found');
    return post;
  }

  async findByIdOrFail(id: string): Promise<NewsPost> {
    const post = await this.newsRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('News post not found');
    return post;
  }
}
