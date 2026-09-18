import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiController } from './ai/ai.controller';
import { GeminiService } from './ai/gemini.service';
import { AuthGuard } from './auth/auth.guard';
import { MeController } from './auth/me.controller';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { ItemsController } from './items/items.controller';
import { ItemsRepository } from './items/items.repository';
import { ItemsService } from './items/items.service';
import { PublicController } from './public/public.controller';
import { StorageService } from './storage/storage.service';
import { UploadController } from './storage/upload.controller';
import { SupabaseService } from './supabase/supabase.service';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    PublicController,
    MeController,
    TenantsController,
    CategoriesController,
    ItemsController,
    UploadController,
    AiController,
  ],
  providers: [
    SupabaseService,
    TenantsService,
    CategoriesService,
    ItemsRepository,
    ItemsService,
    StorageService,
    GeminiService,
    AuthGuard,
  ],
})
export class AppModule {}
