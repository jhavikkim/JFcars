ALTER TABLE `gallery_items`
ADD `media_type` text DEFAULT 'image' NOT NULL
CHECK (`media_type` IN ('image', 'video'));
