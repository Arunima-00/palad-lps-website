'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useLocale } from 'next-intl';

interface Props {
  itemId:       string;
  initialRating?: number;
  totalRatings?:  number;
}

export default function StarRating({ itemId, initialRating = 0, totalRatings = 0 }: Props) {
  const locale   = useLocale();
  const [hover,  setHover]  = useState(0);
  const [rating, setRating] = useState(0);
  const [avg,    setAvg]    = useState(initialRating);
  const [count,  setCount]  = useState(totalRatings);
  const [voted,  setVoted]  = useState(false);

  const handleRate = (value: number) => {
    if (voted) return;
    setRating(value);
    setVoted(true);
    // Optimistic update
    const newCount = count + 1;
    setCount(newCount);
    setAvg(((avg * count) + value) / newCount);
    // TODO: persist to Firestore — addDoc(collection(db, 'ratings'), { itemId, value, ts: serverTimestamp() })
  };

  const label = locale === 'ml' ? 'ഇത് റേറ്റ് ചെയ്യുക' : 'Rate this';
  const thankyou = locale === 'ml' ? 'നന്ദി!' : 'Thank you!';

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            disabled={voted}
            onMouseEnter={() => !voted && setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleRate(star)}
            className="disabled:cursor-default"
            aria-label={`${star} star`}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= (hover || rating || avg)
                  ? 'text-secondary-400 fill-secondary-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <span className={`text-sm text-gray-500 ${locale === 'ml' ? 'font-malayalam' : ''}`}>
        {voted ? thankyou : `${avg > 0 ? avg.toFixed(1) + ' · ' : ''}${label}`}
        {count > 0 && !voted && ` (${count})`}
      </span>
    </div>
  );
}
