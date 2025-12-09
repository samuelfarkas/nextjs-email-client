'use client';

import {
  Box,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';
import { useThreadEmails } from '@/hooks/useThreadEmails';
import { useDeleteThread } from '@/hooks/useDeleteThread';
import { useRestoreThread } from '@/hooks/useRestoreThread';
import ThreadMessage from './ThreadMessage';

interface ThreadViewProps {
  threadId: string;
  subject: string;
  onBack: () => void;
  isTrashView?: boolean;
}

export default function ThreadView({
  threadId,
  subject,
  onBack,
  isTrashView = false,
}: ThreadViewProps) {
  const { data: threadEmails = [], isLoading } = useThreadEmails(threadId);
  const deleteThread = useDeleteThread();
  const restoreThread = useRestoreThread();

  const handleDeleteThread = () => {
    deleteThread.mutate(threadId, {
      onSuccess: () => {
        onBack();
      },
    });
  };

  const handleRestoreThread = () => {
    restoreThread.mutate(threadId, {
      onSuccess: () => {
        onBack();
      },
    });
  };

  const messageCount = threadEmails.length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subject}
            </Typography>
            {messageCount > 1 && (
              <Chip
                label={`${messageCount} messages`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ flexShrink: 0 }}
              />
            )}
          </Box>
        </Box>

        {isTrashView ? (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<RestoreIcon />}
            onClick={handleRestoreThread}
            disabled={restoreThread.isPending}
          >
            Restore
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteThread}
            disabled={deleteThread.isPending}
          >
            Delete
          </Button>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'background.default',
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : threadEmails.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">
              No messages in this thread
            </Typography>
          </Box>
        ) : (
          <Box sx={{ backgroundColor: 'background.paper' }}>
            {threadEmails.map((email, index) => (
              <ThreadMessage
                key={email.id}
                email={email}
                defaultExpanded={index === threadEmails.length - 1}
                isLast={index === threadEmails.length - 1}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
