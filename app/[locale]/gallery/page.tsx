'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Images, X } from 'lucide-react';
import { getCol, getAlbumPhotos, getAllPhotoCounts } from '@/lib/db';
import CommentSection from '@/components/shared/CommentSection';

type Album = {
  id: string;
  titleEn: string;
  titleMl: string;
  thumbBg: string;
  count: number;
  coverUrl?: string;
};
type Photo = { id: string; url: string };

export default function GalleryPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [albums,        setAlbums]        = useState<Album[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState<Album | null>(null);
  const [photos,        setPhotos]        = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [lightbox,      setLightbox]      = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getCol<Album>('gallery_albums'),
      getAllPhotoCounts(),
    ]).then(([data, counts]) => {
      // Replace stored count with actual count from gallery_photos
      const updated = data.map(a => ({ ...a, count: counts[a.id] ?? 0 }));
      setAlbums(updated.sort((a, b) => a.titleEn.localeCompare(b.titleEn)));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openAlbum = async (album: Album) => {
    setSelected(album);
    setPhotos([]);
    setPhotosLoading(true);
    try {
      const data = await getAlbumPhotos(album.id);
      setPhotos(data);
    } catch { setPhotos([]); }
    setPhotosLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'ഫോട്ടോ ഗ്യാലറി' : 'Photo Gallery'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Album grid */}
      {!loading && albums.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Images className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className={ml ? 'font-malayalam' : ''}>
            {ml ? 'ഇതുവരെ ആൽബങ്ങൾ ഇല്ല.' : 'No albums yet.'}
          </p>
          <p className="text-sm mt-2">
            {ml ? 'അഡ്മിൻ → ഗ്യാലറി-ൽ ചേർക്കുക.' : 'Add albums via Admin → Gallery.'}
          </p>
        </div>
      )}

      {!loading && albums.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {albums.map(album => (
            <div key={album.id}
              className="card overflow-hidden cursor-pointer group hover:-translate-y-1 transition-transform"
              onClick={() => openAlbum(album)}>
              <div className={`h-48 bg-gradient-to-br ${album.thumbBg || 'from-primary-400 to-primary-600'} flex items-center justify-center relative overflow-hidden`}>
                {album.coverUrl
                  ? <img src={album.coverUrl} alt={album.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <Images className="h-16 w-16 text-white/60" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity text-sm bg-black/40 px-3 py-1 rounded-full">
                    {ml ? 'കാണുക' : 'View'}
                  </span>
                </div>
                {album.count > 0 && (
                  <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    {album.count} {ml ? 'ഫോട്ടോ' : 'photos'}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className={`font-bold text-gray-800 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? album.titleMl : album.titleEn}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Album modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => { setSelected(null); setPhotos([]); }}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className={`text-xl font-bold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? selected.titleMl : selected.titleEn}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {photosLoading ? '…' : photos.length} {ml ? 'ഫോട്ടോകൾ' : 'photos'}
                </p>
              </div>
              <button onClick={() => { setSelected(null); setPhotos([]); }}
                className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {photosLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {photos.map(photo => (
                    <img key={photo.id} src={photo.url} alt=""
                      className="w-full h-40 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setLightbox(photo.url)} />
                  ))}
                </div>
              ) : (
                <div className={`text-center text-gray-400 py-12 ${ml ? 'font-malayalam' : ''}`}>
                  <Images className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  {ml ? 'ഈ ആൽബത്തിൽ ഇതുവരെ ഫോട്ടോകൾ ഇല്ല.' : 'No photos in this album yet.'}
                </div>
              )}
              <CommentSection itemId={selected.id} />
            </div>
          </div>
        </div>
      )}

      {/* Full-screen lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
            <X className="h-6 w-6" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}

      
    </div>
  );
}
