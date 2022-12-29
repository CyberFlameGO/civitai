import { Carousel } from '@mantine/carousel';
import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Container,
  createStyles,
  Grid,
  Group,
  Loader,
  Menu,
  MultiSelect,
  Select,
  Stack,
  Text,
  Title,
  Alert,
  ThemeIcon,
  Tooltip,
  Rating,
  Card,
} from '@mantine/core';
import { closeAllModals, openConfirmModal } from '@mantine/modals';
import { NextLink } from '@mantine/next';
import { ModelStatus, ModelType } from '@prisma/client';
import {
  IconArrowsSort,
  IconBallpen,
  IconBan,
  IconDotsVertical,
  IconDownload,
  IconEdit,
  IconExclamationMark,
  IconFilter,
  IconFlag,
  IconHeart,
  IconInfoCircle,
  IconLicense,
  IconMessage,
  IconMessageCircle2,
  IconStar,
  IconTrash,
} from '@tabler/icons';
import startCase from 'lodash/startCase';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { NotFound } from '~/components/AppLayout/NotFound';
import { ContentClamp } from '~/components/ContentClamp/ContentClamp';
import {
  DescriptionTable,
  type Props as DescriptionTableProps,
} from '~/components/DescriptionTable/DescriptionTable';
import { getEdgeUrl } from '~/components/EdgeImage/EdgeImage';
import { IconBadge } from '~/components/IconBadge/IconBadge';
import { ImagePreview } from '~/components/ImagePreview/ImagePreview';
import { useInfiniteModelsFilters } from '~/components/InfiniteModels/InfiniteModelsFilters';
import { LoginRedirect } from '~/components/LoginRedirect/LoginRedirect';
import { Meta } from '~/components/Meta/Meta';
import { ModelForm } from '~/components/Model/ModelForm/ModelForm';
import { ModelDiscussion } from '~/components/Model/ModelDiscussion/ModelDiscussion';
import { ModelVersions } from '~/components/Model/ModelVersions/ModelVersions';
import { RenderHtml } from '~/components/RenderHtml/RenderHtml';
import { SensitiveShield } from '~/components/SensitiveShield/SensitiveShield';
import { TrainingWordBadge } from '~/components/TrainingWordBadge/TrainingWordBadge';
import { UserAvatar } from '~/components/UserAvatar/UserAvatar';
import { useIsMobile } from '~/hooks/useIsMobile';
import { ReviewFilter, ReviewSort } from '~/server/common/enums';
import { getServerProxySSGHelpers } from '~/server/utils/getServerProxySSGHelpers';
import { formatDate } from '~/utils/date-helpers';
import { showErrorNotification, showSuccessNotification } from '~/utils/notifications';
import { abbreviateNumber, formatKBytes } from '~/utils/number-helpers';
import { QS } from '~/utils/qs';
import { splitUppercase, removeTags } from '~/utils/string-helpers';
import { trpc } from '~/utils/trpc';
import { isNumber } from '~/utils/type-guards';
import { VerifiedText } from '~/components/VerifiedText/VerifiedText';
import { scrollToTop } from '~/utils/scroll-utils';
import { RunButton } from '~/components/RunStrategy/RunButton';
import { useRoutedContext } from '~/routed-context/routed-context.provider';
import { SFW } from '~/components/Media/SFW';
import { MultiActionButton } from '~/components/MultiActionButton/MultiActionButton';
import { createModelFileDownloadUrl } from '~/server/common/model-helpers';
import { HideUserButton } from '~/components/HideUserButton/HideUserButton';
import { FollowUserButton } from '~/components/FollowUserButton/FollowUserButton';
import { ReportEntity } from '~/server/schema/report.schema';

//TODO - Break model query into multiple queries
/*
  - model details
  - model rank
  - model reviews
  - model-version (only fetch latest model version)
  - model-version rank
  - model-version reviews (for users who only want to see reviews for specific versions)
*/

export const getServerSideProps: GetServerSideProps<{
  id: number;
  slug: string | string[] | null;
}> = async (context) => {
  const params = (context.params ?? {}) as { id: string; slug: string[] };
  const id = Number(params.id);
  if (!isNumber(id))
    return {
      notFound: true,
    };

  const ssg = await getServerProxySSGHelpers(context);
  await ssg.model.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
      slug: params.slug?.[0] ?? '',
    },
  };
};

const useStyles = createStyles((theme) => ({
  actions: {
    [theme.fn.smallerThan('sm')]: {
      width: '100%',
    },
  },

  title: {
    [theme.fn.smallerThan('sm')]: {
      fontSize: theme.fontSizes.xs * 2.4, // 24px
    },
  },

  engagementBar: {
    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },
}));

export default function ModelDetail(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { data: session } = useSession();
  const { classes, theme } = useStyles();
  const mobile = useIsMobile();
  const queryUtils = trpc.useContext();
  const filters = useInfiniteModelsFilters();
  const { openContext } = useRoutedContext();

  const { id, slug } = props;
  const { edit } = router.query;

  const discussionSectionRef = useRef<HTMLDivElement | null>(null);
  const [reviewFilters, setReviewFilters] = useState<{
    filterBy: ReviewFilter[];
    sort: ReviewSort;
  }>({
    filterBy: [],
    sort: ReviewSort.Newest,
  });

  const { data: model, isLoading: loadingModel } = trpc.model.getById.useQuery({ id });
  const { data: favoriteModels = [] } = trpc.user.getFavoriteModels.useQuery(undefined, {
    enabled: !!session,
    cacheTime: Infinity,
    staleTime: Infinity,
  });

  const showNsfwRequested = router.query.showNsfw !== 'true';
  const userNotBlurringNsfw = session?.user?.blurNsfw !== false;
  const nsfw = userNotBlurringNsfw && showNsfwRequested && model?.nsfw === true;
  const isFavorite = favoriteModels.find((favorite) => favorite.modelId === id);

  const deleteMutation = trpc.model.delete.useMutation({
    onSuccess() {
      showSuccessNotification({
        title: 'Your model has been deleted',
        message: 'Successfully deleted the model',
      });
      closeAllModals();
      router.replace('/'); // Redirect to the models or user page once available
    },
    onError(error) {
      showErrorNotification({
        error: new Error(error.message),
        title: 'Could not delete model',
        reason: 'An unexpected error occurred, please try again',
      });
    },
  });
  const unpublishModelMutation = trpc.model.unpublish.useMutation({
    async onSuccess() {
      await queryUtils.model.getById.invalidate({ id });
    },
    onError(error) {
      showErrorNotification({ error: new Error(error.message) });
    },
  });
  const toggleFavoriteModelMutation = trpc.user.toggleFavorite.useMutation({
    async onMutate({ modelId }) {
      await queryUtils.user.getFavoriteModels.cancel();

      const previousFavorites = queryUtils.user.getFavoriteModels.getData() ?? [];
      const previousModel = queryUtils.model.getById.getData({ id: modelId });
      const shouldRemove = previousFavorites.find((favorite) => favorite.modelId === modelId);
      // Update the favorite count
      queryUtils.model.getById.setData({ id: modelId }, (model) => {
        if (model?.rank) model.rank.favoriteCountAllTime += shouldRemove ? -1 : 1;
        return model;
      });
      // Remove from favorites list
      queryUtils.user.getFavoriteModels.setData(undefined, (old = []) =>
        shouldRemove
          ? old.filter((favorite) => favorite.modelId !== modelId)
          : [...old, { modelId }]
      );

      return { previousFavorites, previousModel };
    },
    async onSuccess() {
      await queryUtils.model.getAll.invalidate({ favorites: true });
      queryUtils.model.getAll.setInfiniteData({ ...filters, favorites: true }, () => {
        return { pageParams: [], pages: [] };
      });
    },
    onError(_error, _variables, context) {
      queryUtils.user.getFavoriteModels.setData(undefined, context?.previousFavorites);
      if (context?.previousModel?.id)
        queryUtils.model.getById.setData(
          { id: context?.previousModel?.id },
          context?.previousModel
        );
    },
  });

  const isModerator = session?.user?.isModerator ?? false;
  const isOwner = model?.user.id === session?.user?.id || isModerator;

  // when a user navigates back in their browser, set the previous url with the query string model={id}
  useEffect(() => {
    router.beforePopState(({ as }) => {
      if (as === '/' || as.startsWith('/?') || as.startsWith('/user/') || as.startsWith('/tag/')) {
        const [route, queryString] = as.split('?');
        const queryParams = QS.parse(queryString);
        router.replace({ pathname: route, query: { ...queryParams, model: id } }, as, {
          shallow: true,
        });
        return false;
      }
      return true;
    });

    return () => router.beforePopState(() => true);
  }, [router, id]); // Add any state variables to dependencies array if needed.

  // Latest version is the first one based on sorting (createdAt - desc)
  const latestVersion = model?.modelVersions[0];
  const secondaryFiles = latestVersion?.files?.filter((file) => !file.primary) ?? [];
  const primaryFile = latestVersion?.files?.find((file) => file.primary === true);
  const inaccurate = model?.modelVersions.some((version) => version.inaccurate);
  const hasPendingClaimReport = model?.reportStats && model.reportStats.ownershipProcessing > 0;
  const hasNegativeEmbed =
    model?.type === ModelType.TextualInversion &&
    latestVersion &&
    latestVersion.files.some((x) => x.type === 'Negative');

  if (loadingModel)
    return (
      <Container size="xl">
        <Center>
          <Loader size="xl" />
        </Center>
      </Container>
    );
  if (!model) return <NotFound />;

  const meta = (
    <Meta
      title={`${model.name} | Civitai`}
      description={removeTags(model.description ?? '')}
      image={
        nsfw || latestVersion?.images[0]?.image.url == null
          ? undefined
          : getEdgeUrl(latestVersion.images[0].image.url, { width: 1200 })
      }
    />
  );

  if (!!edit && model && isOwner) return <ModelForm model={model} />;
  if (model.nsfw && !session)
    return (
      <>
        {meta}
        <SensitiveShield redirectTo={router.asPath} />;
      </>
    );

  const handleDeleteModel = () => {
    openConfirmModal({
      title: 'Delete Model',
      children: (
        <Text size="sm">
          Are you sure you want to delete this model? This action is destructive and you will have
          to contact support to restore your data.
        </Text>
      ),
      centered: true,
      labels: { confirm: 'Delete Model', cancel: "No, don't delete it" },
      confirmProps: { color: 'red', loading: deleteMutation.isLoading },
      closeOnConfirm: false,
      onConfirm: () => {
        if (model) {
          deleteMutation.mutate({ id: model.id });
        }
      },
    });
  };

  const handleReviewFilterChange = (values: ReviewFilter[]) => {
    setReviewFilters((current) => ({
      ...current,
      filterBy: values,
    }));
  };

  const handleReviewSortChange = (value: ReviewSort) => {
    setReviewFilters((current) => ({
      ...current,
      sort: value,
    }));
  };

  const handleUnpublishModel = () => {
    unpublishModelMutation.mutate({ id });
  };

  const handleToggleFavorite = () => {
    toggleFavoriteModelMutation.mutate({ modelId: id });
  };

  const modelDetails: DescriptionTableProps['items'] = [
    {
      label: 'Type',
      value: (
        <Group spacing="xs">
          <Badge radius="sm">{splitUppercase(model?.type)}</Badge>
          {model?.status !== ModelStatus.Published && (
            <Badge color="yellow" radius="sm">
              {model.status}
            </Badge>
          )}
        </Group>
      ),
    },
    {
      label: 'Downloads',
      value: <Text>{(model?.rank?.downloadCountAllTime ?? 0).toLocaleString()}</Text>,
    },
    {
      label: 'Last Update',
      value: <Text>{formatDate(model?.updatedAt)}</Text>,
    },
    {
      label: 'Versions',
      value: <Text>{model?.modelVersions.length}</Text>,
    },
    {
      label: 'Base Model',
      value: <Text>{latestVersion?.baseModel}</Text>,
    },
    {
      label: 'Tags',
      value: (
        <Group spacing={4}>
          {model.tagsOnModels.map(({ tag }) => (
            <Link key={tag.id} href={`/tag/${tag.name.toLowerCase()}`} passHref>
              <Badge
                key={tag.id}
                color={tag.color ?? 'blue'}
                component="a"
                size="sm"
                radius="sm"
                sx={{ cursor: 'pointer' }}
              >
                {tag.name}
              </Badge>
            </Link>
          ))}
        </Group>
      ),
    },
    {
      label: 'Trigger Words',
      visible: !!latestVersion?.trainedWords?.length,
      value: (
        <Group spacing={4}>
          {latestVersion?.trainedWords.map((word, index) => (
            <TrainingWordBadge key={index} word={word} />
          ))}
        </Group>
      ),
    },
    {
      label: 'Uploaded By',
      value: model.user && (
        <Group align="center" position="apart" noWrap>
          <Link href={`/user/${model.user.username}`} passHref>
            <Group spacing={4}>
              <UserAvatar user={model.user} avatarProps={{ size: 'sm' }} />
              <Text size="sm" variant="link" component="a" style={{ cursor: 'pointer' }}>
                {model.user.username}
              </Text>
            </Group>
          </Link>
          <FollowUserButton userId={model.user.id} size="xs" compact />
        </Group>
      ),
    },
  ];
  const published = model.status === ModelStatus.Published;

  return (
    <>
      {meta}
      <Container size="xl" pb="xl">
        <Stack spacing="xs" mb="xl">
          <Group align="center" sx={{ justifyContent: 'space-between' }} noWrap>
            <Group align="center" spacing={mobile ? 4 : 'xs'}>
              <Title
                className={classes.title}
                order={1}
                sx={{ paddingBottom: mobile ? 0 : 8, width: mobile ? '100%' : undefined }}
              >
                {model?.name}
              </Title>
              <LoginRedirect reason="favorite-model">
                <IconBadge
                  radius="sm"
                  color={isFavorite ? 'red' : 'gray'}
                  size="lg"
                  icon={
                    <IconHeart
                      size={18}
                      color={isFavorite ? theme.colors.red[6] : undefined}
                      style={{ fill: isFavorite ? theme.colors.red[6] : undefined }}
                    />
                  }
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleToggleFavorite()}
                >
                  <Text size={mobile ? 'sm' : 'md'}>
                    {abbreviateNumber(model.rank?.favoriteCountAllTime ?? 0)}
                  </Text>
                </IconBadge>
              </LoginRedirect>
              <IconBadge
                radius="sm"
                color="gray"
                size="lg"
                icon={<Rating value={model.rank?.ratingAllTime ?? 0} readOnly />}
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  if (!discussionSectionRef.current) return;
                  scrollToTop(discussionSectionRef.current);
                }}
              >
                <Text size={mobile ? 'sm' : 'md'}>
                  {abbreviateNumber(model.rank?.ratingCountAllTime ?? 0)}
                </Text>
              </IconBadge>
            </Group>
            <Menu position="bottom-end" transition="pop-top-right">
              <Menu.Target>
                <ActionIcon variant="outline">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {session && isOwner && published && (
                  <Menu.Item
                    icon={<IconBan size={14} stroke={1.5} />}
                    color="yellow"
                    onClick={handleUnpublishModel}
                    disabled={unpublishModelMutation.isLoading}
                  >
                    Unpublish
                  </Menu.Item>
                )}
                {session && isOwner && (
                  <>
                    <Menu.Item
                      color={theme.colors.red[6]}
                      icon={<IconTrash size={14} stroke={1.5} />}
                      onClick={handleDeleteModel}
                    >
                      Delete Model
                    </Menu.Item>
                    <Menu.Item
                      component={NextLink}
                      href={`/models/${id}/${slug}?edit=true`}
                      icon={<IconEdit size={14} stroke={1.5} />}
                      shallow
                    >
                      Edit Model
                    </Menu.Item>
                  </>
                )}
                {(!session || !isOwner || isModerator) && (
                  <LoginRedirect reason="report-model">
                    <Menu.Item
                      icon={<IconFlag size={14} stroke={1.5} />}
                      onClick={() =>
                        openContext('report', { type: ReportEntity.Model, entityId: model.id })
                      }
                    >
                      Report
                    </Menu.Item>
                  </LoginRedirect>
                )}
                {session && <HideUserButton as="menu-item" userId={model.user.id} />}
              </Menu.Dropdown>
            </Menu>
          </Group>
          {model.status === ModelStatus.Unpublished && (
            <Alert color="red">
              <Group spacing="xs" noWrap align="flex-start">
                <ThemeIcon color="red">
                  <IconExclamationMark />
                </ThemeIcon>
                <Text size="md">
                  This model has been unpublished and is not visible to the community.
                </Text>
              </Group>
            </Alert>
          )}
          {inaccurate && (
            <Alert color="yellow">
              <Group spacing="xs" noWrap align="flex-start">
                <ThemeIcon color="yellow">
                  <IconExclamationMark />
                </ThemeIcon>
                <Text size="md">
                  The images on this {splitUppercase(model.type).toLowerCase()} are inaccurate.
                  Please submit reviews with images so that we can improve this page.
                </Text>
              </Group>
            </Alert>
          )}
        </Stack>
        <Grid gutter="xl">
          <Grid.Col xs={12} sm={5} md={4} orderSm={2}>
            <Stack>
              {latestVersion && (
                <Group spacing="xs" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  <Stack sx={{ flex: 1 }} spacing={4}>
                    <MultiActionButton
                      component="a"
                      href={createModelFileDownloadUrl({
                        versionId: latestVersion.id,
                        primary: true,
                      })}
                      leftIcon={<IconDownload size={16} />}
                      disabled={!primaryFile}
                      menuItems={secondaryFiles.map((file, index) => (
                        <Menu.Item
                          key={index}
                          component="a"
                          py={4}
                          icon={<VerifiedText file={file} iconOnly />}
                          href={createModelFileDownloadUrl({
                            versionId: latestVersion.id,
                            type: file.type,
                            format: file.format,
                          })}
                          download
                        >
                          {`${startCase(file.type)}${
                            ['Model', 'Pruned Model'].includes(file.type) ? ' ' + file.format : ''
                          } (${formatKBytes(file.sizeKB)})`}
                        </Menu.Item>
                      ))}
                      download
                    >
                      <Text align="center">
                        {`Download Latest (${formatKBytes(primaryFile?.sizeKB ?? 0)})`}
                      </Text>
                    </MultiActionButton>
                    {primaryFile && (
                      <Group position="apart">
                        <VerifiedText file={primaryFile} />
                        <Text size="xs" color="dimmed">
                          {primaryFile.format}
                        </Text>
                      </Group>
                    )}
                  </Stack>

                  <RunButton modelVersionId={latestVersion.id} />
                  <Tooltip label={isFavorite ? 'Unlike' : 'Like'} position="bottom" withArrow>
                    <div>
                      <LoginRedirect reason="favorite-model">
                        <Button
                          onClick={() => handleToggleFavorite()}
                          color={isFavorite ? 'red' : 'gray'}
                          sx={{ cursor: 'pointer', paddingLeft: 0, paddingRight: 0, width: '36px' }}
                        >
                          <IconHeart color="#fff" />
                        </Button>
                      </LoginRedirect>
                    </div>
                  </Tooltip>
                </Group>
              )}
              {hasNegativeEmbed && (
                <Alert radius="sm">
                  <Group spacing="xs" noWrap>
                    <ThemeIcon>
                      <IconInfoCircle />
                    </ThemeIcon>
                    <Text size="xs" sx={{ lineHeight: 1.1 }}>
                      This Textual Inversion includes a Negative embed, click the dropdown and
                      download the negative for full effect.
                    </Text>
                  </Group>
                </Alert>
              )}
              <DescriptionTable items={modelDetails} labelWidth="30%" />
              {model?.type === 'Checkpoint' && (
                <Group position="right" spacing="xs">
                  <IconLicense size={16} />
                  <Text size="xs" color="dimmed">
                    License:{' '}
                    <Text
                      component="a"
                      href="https://huggingface.co/spaces/CompVis/stable-diffusion-license"
                      rel="nofollow"
                      td="underline"
                      target="_blank"
                    >
                      creativeml-openrail-m
                    </Text>
                  </Text>
                </Group>
              )}
              {hasPendingClaimReport && (
                <Alert>
                  <Group spacing="xs" noWrap>
                    <ThemeIcon size="lg">
                      <IconMessageCircle2 />
                    </ThemeIcon>
                    <Text size="xs" sx={{ lineHeight: 1.1 }}>
                      {`A verified artist believes this model was fine-tuned on their art. We're discussing this with the model creator and artist`}
                    </Text>
                  </Group>
                </Alert>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col
            xs={12}
            sm={7}
            md={8}
            orderSm={1}
            sx={(theme) => ({
              [theme.fn.largerThan('xs')]: {
                padding: `0 ${theme.spacing.sm}px`,
                margin: `${theme.spacing.sm}px 0`,
              },
            })}
          >
            <Stack>
              <SFW type="model" id={model.id} nsfw={model.nsfw}>
                {({ nsfw, showNsfw }) => (
                  <>
                    <SFW.Placeholder>
                      <Card
                        p="md"
                        radius="sm"
                        withBorder
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%,-50%)',
                          zIndex: 10,
                        }}
                      >
                        <Stack>
                          <Text>This model has been marked NSFW</Text>
                          <SFW.Toggle>
                            <Button>Click to view</Button>
                          </SFW.Toggle>
                        </Stack>
                      </Card>
                    </SFW.Placeholder>
                    <Carousel
                      slideSize="50%"
                      breakpoints={[{ maxWidth: 'sm', slideSize: '100%', slideGap: 2 }]}
                      slideGap="xl"
                      align={latestVersion && latestVersion.images.length > 2 ? 'start' : 'center'}
                      slidesToScroll={mobile ? 1 : 2}
                      withControls={latestVersion && latestVersion.images.length > 2 ? true : false}
                      loop
                    >
                      {latestVersion?.images.map(({ image }, index) => (
                        <Carousel.Slide key={image.id}>
                          <Center style={{ height: '100%' }}>
                            {/* <Media.Placeholder>
                              <AspectRatio
                                ratio={(image?.width ?? 1) / (image?.height ?? 1)}
                                style={{ height: 400 }}
                              >
                                <MediaHash
                                  {...image}
                                  style={{ height: '300px', width: '300px', position: 'relative' }}
                                />
                              </AspectRatio>
                            </Media.Placeholder>
                            <Media.Content>
                              <EdgeImage
                                src={image.url}
                                alt={image.name ?? undefined}
                                width={450}
                                placeholder="empty"
                                style={{ width: '100%', zIndex: 2, position: 'relative' }}
                              />
                            </Media.Content> */}
                            <ImagePreview
                              image={image}
                              edgeImageProps={{ width: 400 }}
                              nsfw={nsfw && !showNsfw}
                              radius="md"
                              onClick={() =>
                                openContext('modelVersionLightbox', {
                                  modelVersionId: latestVersion.id,
                                  initialSlide: index,
                                })
                              }
                              style={{ width: '100%' }}
                              withMeta
                            />
                          </Center>
                        </Carousel.Slide>
                      ))}
                    </Carousel>
                  </>
                )}
              </SFW>

              {model.description ? (
                <ContentClamp maxHeight={300}>
                  <RenderHtml html={model.description} />
                </ContentClamp>
              ) : null}
            </Stack>
          </Grid.Col>
          <Grid.Col span={12} orderSm={3} my="xl">
            <Stack spacing="xl">
              <Title className={classes.title} order={2}>
                Versions
              </Title>
              <ModelVersions
                items={model.modelVersions}
                initialTab={latestVersion?.id.toString()}
                nsfw={model.nsfw}
              />
            </Stack>
          </Grid.Col>
          <Grid.Col span={12} orderSm={4} my="xl">
            <Stack spacing="xl">
              <Group ref={discussionSectionRef} sx={{ justifyContent: 'space-between' }}>
                <Group spacing="xs">
                  <Title order={3}>Discussion</Title>

                  <LoginRedirect reason="create-review">
                    <Button
                      leftIcon={<IconStar size={16} />}
                      variant="outline"
                      fullWidth={mobile}
                      size="xs"
                      onClick={() => openContext('reviewEdit', {})}
                    >
                      Add Review
                    </Button>
                  </LoginRedirect>
                  <LoginRedirect reason="create-comment">
                    <Button
                      leftIcon={<IconMessage size={16} />}
                      variant="outline"
                      fullWidth={mobile}
                      onClick={() => openContext('commentEdit', {})}
                      size="xs"
                    >
                      Add Comment
                    </Button>
                  </LoginRedirect>
                </Group>
                <Group spacing="xs" noWrap grow>
                  <Select
                    defaultValue={ReviewSort.Newest}
                    icon={<IconArrowsSort size={14} />}
                    data={Object.values(ReviewSort)
                      // Only exclude MostDisliked until there's a clear way to sort by it
                      .filter((sort) => ![ReviewSort.MostDisliked].includes(sort))
                      .map((sort) => ({
                        label: startCase(sort),
                        value: sort,
                      }))}
                    onChange={handleReviewSortChange}
                    size="xs"
                  />
                  <MultiSelect
                    placeholder="Filters"
                    icon={<IconFilter size={14} />}
                    data={Object.values(ReviewFilter).map((sort) => ({
                      label: startCase(sort),
                      value: sort,
                    }))}
                    onChange={handleReviewFilterChange}
                    size="xs"
                    zIndex={500}
                    clearButtonLabel="Clear review filters"
                    clearable
                  />
                </Group>
              </Group>
              <ModelDiscussion modelId={model.id} filters={reviewFilters} />
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  );
}
