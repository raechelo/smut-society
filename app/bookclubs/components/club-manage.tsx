'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Archive,
  ArchiveRestore,
  Loader2,
  LogOut,
  Pencil,
  Settings2,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/app/dialog';
import Typography from '@/components/ui/typography';
import {
  archiveClub,
  deleteClub,
  leaveClub,
  renameClub,
  unarchiveClub,
} from '@/lib/actions/clubs';

type ClubManageProps = {
  clubId: string;
  clubName: string;
  isAdmin: boolean;
  // The club's creator. Only the owner can delete the club.
  isOwner: boolean;
  archived: boolean;
};

const ROW = 'w-full justify-start';

export function ClubManage({
  clubId,
  clubName,
  isAdmin,
  isOwner,
  archived,
}: ClubManageProps) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <Settings2 className='size-5' />
        <Typography classNames='text-xl'>Manage</Typography>
      </div>
      <Card
        shadow
        className='gap-sm'
      >
        {isAdmin ? (
          <AdminControls
            clubId={clubId}
            clubName={clubName}
            isOwner={isOwner}
            archived={archived}
          />
        ) : (
          <LeaveControl clubId={clubId} />
        )}
      </Card>
    </div>
  );
}

function LeaveControl({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLeave = async () => {
    setLoading(true);
    try {
      await leaveClub(clubId);
      toast.success('Left club');
      // Leaving a private club would 404 on refresh, so head back to the list.
      router.push('/bookclubs');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not leave club');
      setLoading(false);
    }
  };

  return (
    <Button
      variant='outline'
      size='sm'
      className={ROW}
      onClick={handleLeave}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className='size-4 animate-spin' />
      ) : (
        <LogOut className='size-4' />
      )}
      Leave club
    </Button>
  );
}

type BusyAction = 'rename' | 'archive' | 'delete';

function AdminControls({
  clubId,
  clubName,
  isOwner,
  archived,
}: {
  clubId: string;
  clubName: string;
  isOwner: boolean;
  archived: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(clubName);

  const handleRename = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy('rename');
    try {
      await renameClub(clubId, trimmed);
      toast.success('Club renamed');
      setRenameOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not rename club');
    } finally {
      setBusy(null);
    }
  };

  const handleArchive = async () => {
    setBusy('archive');
    try {
      if (archived) {
        await unarchiveClub(clubId);
        toast.success('Club restored');
      } else {
        await archiveClub(clubId);
        toast.success('Club archived');
      }
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not update the club'
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy('delete');
    try {
      await deleteClub(clubId);
      toast.success('Club deleted');
      router.push('/bookclubs');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete club');
      setBusy(null);
    }
  };

  return (
    <>
      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (open) setName(clubName);
        }}
        trigger={
          <Button
            variant='outline'
            size='sm'
            className={ROW}
          >
            <Pencil className='size-4' /> Rename club
          </Button>
        }
        title='Rename club'
        description='Give your club a new name.'
        content={
          <form
            className='flex flex-col gap-4'
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Club name'
              autoFocus
            />
            <Button
              type='submit'
              disabled={!name.trim() || busy === 'rename'}
            >
              {busy === 'rename' ? (
                <Loader2 className='size-4 animate-spin' />
              ) : null}
              Save name
            </Button>
          </form>
        }
      />

      <Button
        variant='outline'
        size='sm'
        className={ROW}
        onClick={handleArchive}
        disabled={busy !== null}
      >
        {busy === 'archive' ? (
          <Loader2 className='size-4 animate-spin' />
        ) : archived ? (
          <ArchiveRestore className='size-4' />
        ) : (
          <Archive className='size-4' />
        )}
        {archived ? 'Restore club' : 'Archive club'}
      </Button>

      {isOwner && (
        <Dialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          trigger={
            <Button
              variant='outline'
              color='error'
              size='sm'
              className={ROW}
            >
              <Trash2 className='size-4' /> Delete club
            </Button>
          }
          title='Delete this club?'
          description='This permanently removes the club along with its members, nominations, events, and reading history. This cannot be undone.'
          footer={
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setDeleteOpen(false)}
                disabled={busy === 'delete'}
              >
                Cancel
              </Button>
              <Button
                color='error'
                onClick={handleDelete}
                disabled={busy === 'delete'}
              >
                {busy === 'delete' ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Trash2 className='size-4' />
                )}
                Delete club
              </Button>
            </div>
          }
        />
      )}
    </>
  );
}
