import * as mm from 'music-metadata-browser';

export const extractMetadata = async (file: File | Blob, index: number, filepath: string) => {
  try {
    // 1. Analizar el archivo
    const metadata = await mm.parseBlob(file);

    // 2. Extraer la imagen (Carátula)
    let coverUrl = '';
    const picture = metadata.common.picture?.[0];
    
    if (picture) {
      // Convertimos el Buffer de Node.js a Uint8Array compatible con el navegador
      const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
      coverUrl = URL.createObjectURL(blob);
    }

    // 3. Formatear la duración (está en segundos)
    const duration = metadata.format.duration || 0;
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

    // 4. Retornar el objeto con la información estructurada
    return {
      id: index,
      title: metadata.common.title || 'Título desconocido',
      artist: metadata.common.artist || 'Artista desconocido',
      album: metadata.common.album || 'Álbum desconocido',
      year: metadata.common.year?.toString() || 'N/A',
      image: coverUrl,
      duration: formattedTime,
      filepath: filepath,
    };

  } catch (error) {
    console.error("Error al leer los metadatos:", error);
    throw error;
  }
};