import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AboutPage } from './entities/about-page.entity.js';
import { UpdateAboutPageDto } from './dto/update-about-page.dto.js';

@Injectable()
export class AboutPageService {
  constructor(@InjectRepository(AboutPage) private readonly aboutRepo: Repository<AboutPage>) {}

  async getContent(): Promise<AboutPage> {
    const existing = await this.aboutRepo.find({ take: 1 });
    if (existing.length > 0) return existing[0];
    return this.aboutRepo.save(this.aboutRepo.create({}));
  }

  async update(dto: UpdateAboutPageDto, updatedByUserId: string): Promise<AboutPage> {
    const page = await this.getContent();
    Object.assign(page, dto);
    page.updatedByUserId = updatedByUserId;
    return this.aboutRepo.save(page);
  }
}
