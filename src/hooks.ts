import { useState, useEffect } from "react";
import axios from "axios";

export interface ITypeaheadState<T> {
  loading: boolean;
  error: any;
  results: T[]
}

export function useTypeahead<T>(baseUri: string): [ITypeaheadState<T>, (searchString: string) => void] {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelToken, setCancelToken] = useState(axios.CancelToken.source());
  const [results, setResults] = useState<T[]>([]);
  const [uri, setUri] = useState(baseUri);
  const search = (searchString: string) => { setUri(baseUri + searchString); }

  useEffect(() => {
    let needsCancel = true;

    const fireSearch = async () => {
      setLoading(true);
      try {
        const response = await axios.get(uri, { cancelToken: cancelToken.token });
        needsCancel = false;
        setResults(response.data);
        setLoading(false);
      } catch (err) {
        if (axios.isCancel(err)) {
          setCancelToken(axios.CancelToken.source());
        } else {
          needsCancel = false;
          setLoading(false);
          setError(err);
        }
      }
    }

    fireSearch();

    const cleanup = () => {
      if (needsCancel) {
        cancelToken.cancel();
      }
    }
    return cleanup;
  }, [uri]);

  const state = { loading, error, results };
  return [state, search];
}