'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Star,
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';
import { Email } from '@/lib/schema';
import { useDeleteThread } from '@/hooks/useDeleteThread';
import { useRestoreThread } from '@/hooks/useRestoreThread';
import { getInitials, formatRelativeDate } from '@/utils';

interface EmailCardProps {
  email: Email;
  selected?: boolean;
  threadCount?: number;
  isTrashView?: boolean;
}

const EmailCard: React.FC<EmailCardProps> = ({
  email,
  selected = false,
  threadCount,
  isTrashView = false,
}) => {
  const deleteThread = useDeleteThread();
  const restoreThread = useRestoreThread();

  const handleDelete = () => {
    deleteThread.mutate(email.threadId);
  };

  const handleRestore = () => {
    restoreThread.mutate(email.threadId);
  };

  return (
    <Card
      data-testid={`email-card-${email.id}`}
      sx={{
        borderRadius: 1,
        boxShadow: email.isRead ? 0 : 1,
        border: selected
          ? '2px solid'
          : email.isRead
            ? '2px solid'
            : '2px solid',
        borderColor: selected
          ? 'primary.main'
          : email.isRead
            ? 'divider'
            : 'primary.light',
        backgroundColor: selected
          ? 'primary.50'
          : email.isRead
            ? 'background.paper'
            : 'action.hover',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        position: 'relative',
        '&:hover': {
          boxShadow: 2,
          backgroundColor: selected ? 'primary.50' : 'action.hover',
        },
        '& .email-actions': { display: 'none' },
        '&:hover .email-actions': { display: 'flex' },
        '&:hover .email-metadata': { display: 'none' },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box
          sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}
        >
          <Avatar
            sx={{
              bgcolor: email.isImportant ? 'warning.main' : 'primary.main',
              width: 32,
              height: 32,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {getInitials(email.from)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}
            >
              <Typography
                variant="subtitle2"
                data-testid={`email-subject-${email.id}`}
                sx={{
                  fontWeight: email.isRead ? 400 : 600,
                  color: email.isRead ? 'text.secondary' : 'text.primary',
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {email.subject}
              </Typography>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {email.from}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box className="email-actions">
              {isTrashView ? (
                <IconButton
                  size="small"
                  onClick={handleRestore}
                  disabled={restoreThread.isPending}
                  sx={{ p: 0.5 }}
                  color="primary"
                >
                  <RestoreIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  onClick={handleDelete}
                  disabled={deleteThread.isPending}
                  sx={{ p: 0.5 }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Box
              className="email-metadata"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.75rem' }}
                suppressHydrationWarning
              >
                {formatRelativeDate(email.createdAt)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                {email.isImportant && (
                  <Star sx={{ color: 'warning.main', fontSize: '1rem' }} />
                )}
                {!email.isRead && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 1,
          }}
        >
          {email.content
            ? email.content.substring(0, 30) + '...'
            : 'Empty content'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          {threadCount && threadCount > 1 && (
            <Chip
              label={`${threadCount}`}
              size="small"
              color="default"
              variant="filled"
              sx={{ fontSize: '0.65rem', height: 20, minWidth: 24 }}
            />
          )}
          {!email.isRead && (
            <Chip
              label="Unread"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20 }}
            />
          )}
          {email.isImportant && (
            <Chip
              label="Important"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20 }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default EmailCard;
