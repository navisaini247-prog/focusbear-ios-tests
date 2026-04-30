import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchTasks, searchTasks } from "@/actions/UserActions";

export const useFetchTodos = (status, order) => {
  const dispatch = useDispatch();
  const take = 50;

  const [loadedPages, setLoadedPages] = useState(0);
  const [canLoadMore, setCanLoadMore] = useState(false);

  const refresh = useCallback(async () => {
    const { pageCount } = await dispatch(fetchTasks({ page: 1, take, status, order }));

    setCanLoadMore(pageCount > 1);
    setLoadedPages(1);
  }, [status, dispatch, order]);

  const loadMore = useCallback(async () => {
    if (canLoadMore) {
      const nextPage = loadedPages + 1;
      const { pageCount } = await dispatch(fetchTasks({ page: nextPage, take, status, order }));

      setLoadedPages(nextPage);
      setCanLoadMore(nextPage < pageCount);
    }
  }, [status, dispatch, loadedPages, canLoadMore, order]);

  return useMemo(() => ({ refresh, loadMore, canLoadMore }), [refresh, loadMore, canLoadMore]);
};

export const useSearchTodos = () => {
  const dispatch = useDispatch();

  const [results, setResults] = useState([]);

  const search = useCallback(
    async (title) => {
      if (!title.trim()) {
        setResults([]);
        return;
      }
      const newResults = await dispatch(searchTasks({ title }));
      setResults(newResults);
    },
    [dispatch],
  );

  const clearResults = useCallback(() => setResults([]), []);

  return useMemo(() => ({ results, search, clearResults }), [results, search, clearResults]);
};
