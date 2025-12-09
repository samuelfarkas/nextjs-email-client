'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Box,
  Chip,
  InputAdornment,
  TextField,
  Typography,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import EmailCard from '@/components/EmailCard';
import { useEmails } from '@/hooks/useEmails';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useUpdateEmail } from '@/hooks/useUpdateEmail';
import { useThreadCounts } from '@/hooks/useThreadCounts';
import { useTypedSearchParams } from '@/hooks/useTypedSearchParams';
import { Email } from '@/lib/schema';
import { emailListParamsSchema } from '@/lib/searchParams';
import { PaginatedResult } from '@/services/emailService';

interface EmailListPanelProps {
  selectedThreadId?: string | null;
  initialData?: PaginatedResult<Email>;
  initialFilter?: string;
}

export default function EmailListPanel({
  selectedThreadId,
  initialData,
  initialFilter,
}: EmailListPanelProps) {
  const { params, setParams, toQueryString } = useTypedSearchParams(
    emailListParamsSchema,
  );
  const { page, pageSize, filter: activeFilter } = params;

  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useDebouncedValue(searchTerm, 500);
  const shouldSearch = debouncedSearch.length >= 3;

  // Only use initialData if filter hasn't changed from initial server render
  const canUseInitialData = initialFilter === activeFilter;

  const {
    data: paginatedResult,
    isLoading,
    isFetching,
  } = useEmails(
    {
      search: shouldSearch ? debouncedSearch : undefined,
      filter: activeFilter,
      threadOnly: true,
      page,
      pageSize,
    },
    canUseInitialData ? initialData : undefined,
  );

  const emailList = paginatedResult?.data ?? [];
  const pagination = paginatedResult?.pagination;

  // Track previous filter/search to only reset page when they actually change
  const prevFilterRef = useRef(activeFilter);
  const prevSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    const filterChanged = prevFilterRef.current !== activeFilter;
    const searchChanged = prevSearchRef.current !== debouncedSearch;

    if (filterChanged || searchChanged) {
      setParams({ page: 0 });
    }

    prevFilterRef.current = activeFilter;
    prevSearchRef.current = debouncedSearch;
  }, [activeFilter, debouncedSearch, setParams]);

  const updateEmail = useUpdateEmail();
  const { data: threadCounts = {} } = useThreadCounts();

  const unreadCount = emailList.filter((email) => !email.isRead).length;
  const importantCount = emailList.filter((email) => email.isImportant).length;

  const getThreadHref = (threadId: string) => {
    // Preserve non-default search params when navigating to thread
    const queryString = toQueryString();
    return `/thread/${threadId}${queryString ? `?${queryString}` : ''}`;
  };

  const handleEmailClick = (email: Email) => {
    if (!email.isRead) {
      updateEmail.mutate({ id: email.id, isRead: true });
    }
  };

  const getFilterTitle = () => {
    switch (activeFilter) {
      case 'important':
        return 'Important';
      case 'sent':
        return 'Sent';
      case 'trash':
        return 'Trash';
      default:
        return 'Inbox';
    }
  };

  const isTrashView = activeFilter === 'trash';

  return (
    <Box
      sx={{
        width: '400px',
        borderRight: '1px solid',
        borderRightColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        height: '100%',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{ p: 2, borderBottom: '1px solid', borderBottomColor: 'divider' }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}
        >
          {getFilterTitle()}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip
            label={`${pagination?.total ?? emailList.length} Total`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${unreadCount} Unread`}
            size="small"
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`${importantCount} Important`}
            size="small"
            color="secondary"
            variant="outlined"
          />
        </Box>
      </Box>

      <Box
        sx={{ p: 2, borderBottom: '1px solid', borderBottomColor: 'divider' }}
      >
        <TextField
          fullWidth
          placeholder="Search emails..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: isFetching ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : null,
              sx: { backgroundColor: 'background.default' },
            },
          }}
        />
        {searchTerm && searchTerm.length < 3 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
          >
            Type at least 3 characters to search
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
        }}
        data-testid="email-list"
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : emailList.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">
              {searchTerm ? 'No emails found' : 'No emails'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {emailList.map((email) => (
              <Link
                key={email.id}
                href={getThreadHref(email.threadId)}
                onClick={() => {
                  handleEmailClick(email);
                }}
                style={{ textDecoration: 'none' }}
              >
                <EmailCard
                  email={email}
                  selected={selectedThreadId === email.threadId}
                  threadCount={threadCounts[email.threadId]}
                  isTrashView={isTrashView}
                />
              </Link>
            ))}
          </Box>
        )}
      </Box>

      <TablePagination
        component="div"
        count={pagination?.total ?? 0}
        page={page}
        onPageChange={(_, newPage) => setParams({ page: newPage })}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setParams({ pageSize: parseInt(e.target.value, 10), page: 0 });
        }}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="Per page:"
        sx={{
          borderTop: '1px solid',
          borderTopColor: 'divider',
          flexShrink: 0,
        }}
      />
    </Box>
  );
}
