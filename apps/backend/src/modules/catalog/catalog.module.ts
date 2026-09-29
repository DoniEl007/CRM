import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity.js';
import { NewsPost } from './entities/news-post.entity.js';
import { AboutPage } from './entities/about-page.entity.js';
import { CoursesService } from './courses.service.js';
import { CoursesController } from './courses.controller.js';
import { NewsPostsService } from './news-posts.service.js';
import { NewsPostsController } from './news-posts.controller.js';
import { AboutPageService } from './about-page.service.js';
import { AboutPageController } from './about-page.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Course, NewsPost, AboutPage])],
  providers: [CoursesService, NewsPostsService, AboutPageService],
  controllers: [CoursesController, NewsPostsController, AboutPageController],
  exports: [CoursesService, NewsPostsService, AboutPageService],
})
export class CatalogModule {}
