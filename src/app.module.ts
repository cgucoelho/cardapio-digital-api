import { Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { modoSupabase } from './config';
import { ItemsController } from './items/items.controller';
import { ItemsRepository } from './items/items.repository';
import { ItemsService } from './items/items.service';
import { LocalItemsRepository } from './items/local-items.repository';
import { SupabaseItemsRepository } from './items/supabase-items.repository';
import { LocalStorageService } from './storage/local-storage.service';
import { StorageService } from './storage/storage.service';
import { SupabaseStorageService } from './storage/supabase-storage.service';
import { UploadController } from './storage/upload.controller';
import { SupabaseService } from './supabase/supabase.service';

const providersSupabase: Provider[] = [
  SupabaseService,
  { provide: ItemsRepository, useClass: SupabaseItemsRepository },
  { provide: StorageService, useClass: SupabaseStorageService },
];

const providersLocais: Provider[] = [
  { provide: ItemsRepository, useClass: LocalItemsRepository },
  { provide: StorageService, useClass: LocalStorageService },
];

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ItemsController, UploadController],
  providers: [
    ItemsService,
    ...(modoSupabase() ? providersSupabase : providersLocais),
  ],
})
export class AppModule {}
