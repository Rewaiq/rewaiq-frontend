'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Coins, SlidersHorizontal, Play, CheckCircle, Circle, Bell, Users } from 'lucide-react';
import API from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import InstallPrompt from '@/components/InstallPrompt';
import { Suspense } from 'react';
import Spinner from '@/components/Spinner';

const CAROUSEL_SLIDES = [
  {
    id: 1,
    type: 'workflow',
    title: 'How to Start Earning',
    steps: ['Register', 'Stream Music', 'Do Tasks', 'Cashout'],
    bg: 'linear-gradient(135deg, #1a3a8f, #4a9eff)',
  },
  {
    id: 2,
    type: 'promo',
    title: 'Promote Your Brand',
    sub: 'Reach 500+ engaged Nigerian youth',
    cta: 'From N15,000 →',
    action: '/promote',
    bg: 'linear-gradient(135deg, #D4A017, #F0C040)',
    textColor: '#0A1628',
  },
  {
    id: 3,
    type: 'promo',
    title: '🎉 Hub Now Open in Aba!',
    sub: 'Learn Data Analysis, Web Dev, UI/UX at Yellow Avenue, Aba',
    cta: 'Join First Cohort →',
    action: 'https://wa.me/2348168099351',
    bg: 'linear-gradient(135deg, #1A7A4A, #4ADE80)',
    textColor: '#fff',
  },
  {
    id: 4,
    type: 'promo',
    title: '🎵 Are You an Artist?',
    sub: 'Get your music streamed by thousands of Nigerian youth',
    cta: 'Promote Your Music →',
    action: '/artist/promote',
    bg: 'linear-gradient(135deg, #0D1F3C, #2d6be4)',
    textColor: '#fff',
  },
];

/* =========================================================
   HOME CONTENT
   ========================================================= */

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [unreadCount, setUnreadCount] = useState(0);
  const [tracks, setTracks] = useState([]);
  const [tasks, setTasks] = useState([]);

  /*
   * IMPORTANT:
   * Read ?tab=tasks from the URL.
   */
  const [tab, setTab] = useState(() => {
    const urlTab = searchParams.get('tab');

    if (
      urlTab === 'tasks' ||
      urlTab === 'trending' ||
      urlTab === 'for-you'
    ) {
      return urlTab;
    }

    return 'for-you';
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');
  const [carouselIndex, setCarouselIndex] = useState(0);

  /*
   * If the URL changes from:
   * /home
   * to:
   * /home?tab=tasks
   *
   * update the selected tab.
   */
  useEffect(() => {
    const urlTab = searchParams.get('tab');

    if (
      urlTab === 'tasks' ||
      urlTab === 'trending' ||
      urlTab === 'for-you'
    ) {
      setTab(urlTab);
    } else {
      setTab('for-you');
    }
  }, [searchParams]);

  /*
   * Load user + feed
   */
  useEffect(() => {
    const u = localStorage.getItem('rewaiq_user');

    if (!u) {
      router.push('/welcome');
      return;
    }

    try {
      setUser(JSON.parse(u));
    } catch {
      localStorage.removeItem('rewaiq_user');
      router.push('/welcome');
      return;
    }

    fetchFeed();
  }, []);

  /*
   * Notifications
   */
  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const res = await API.get('/api/notifications');

        const unread = (res.data.notifications || [])
          .filter(n => !n.is_read)
          .length;

        setUnreadCount(unread);
      } catch {}
    };

    pollNotifications();

    const interval = setInterval(
      pollNotifications,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  /*
   * Carousel
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex(
        i => (i + 1) % CAROUSEL_SLIDES.length
      );
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  /*
   * Fetch feed
   */
  const fetchFeed = async () => {
    try {
      const [tracksRes, tasksRes] =
        await Promise.all([
          API.get('/api/tracks'),
          API.get('/api/feed/tasks'),
        ]);

      setTracks(tracksRes.data.tracks || []);
      setTasks(tasksRes.data.tasks || []);
    } catch {
      // Keep UI alive even if feed request fails
    } finally {
      setLoading(false);
    }
  };

  /*
   * Tab change
   */
  const handleTabChange = (newTab) => {
    setTab(newTab);
    setShowFilter(false);
    setTaskFilter('all');

    /*
     * Keep URL synchronized with selected tab.
     */
    if (newTab === 'for-you') {
      router.push('/home');
    } else {
      router.push(`/home?tab=${newTab}`);
    }
  };

  /*
   * Filter tasks
   */
  const filteredTasks =
    taskFilter === 'all'
      ? tasks
      : tasks.filter(
          t => t.task_type === taskFilter
        );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A1628',
        paddingBottom: 80,
      }}
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          padding: '16px 20px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0A1628',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom:
            '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg
            width="24"
            height="20"
            viewBox="0 0 100 80"
          >
            <path
              d="M11.0669 64.9132V27.8448C11.0669 27.3337 11.665 27.0567 12.0548 27.3871L62.735 70.3446C63.0191 70.5854 62.8488 71.0497 62.4764 71.0497H49.5669C39.3371 70.5626 30.0565 65.3295 22.1875 58.5871C21.8251 58.2766 21.2945 58.2594 20.9163 58.5505L12.0329 65.3886C11.6383 65.6923 11.0669 65.4111 11.0669 64.9132Z"
              fill="#1a3a8f"
            />

            <path
              d="M12.2466 20.8923C9.56504 17.9523 8.61661 13.8979 9.13672 10.6093C9.62504 7.52173 11.9248 5.00455 14.5282 3.27418C15.9203 2.34889 17.5956 1.50727 19.4373 0.975666C20.5603 0.651546 21.7464 1.00602 22.6382 1.76144L98.8583 66.325C99.196 66.611 99.1179 67.1516 98.712 67.3279C90.4102 70.9338 84.6197 72.1928 72.4271 71.665C71.9843 71.6459 71.5565 71.4777 71.2195 71.1903L12.2466 20.8923Z"
              fill="#4a9eff"
            />

            <path
              d="M72.4608 71.6478C84.77 72.2692 90.6026 71.0456 98.9505 67.478C99.3591 67.3034 99.4388 66.76 99.0994 66.4732L63.7412 36.6038C53.6976 40.1309 47.5016 40.9898 35.5864 40.7853L71.2682 71.1746C71.6014 71.4584 72.0237 71.6257 72.4608 71.6478Z"
              fill="#2d6be4"
            />
          </svg>

          <span
            style={{
              fontFamily:
                'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: 18,
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            Rewaiq
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            onClick={() =>
              router.push('/wallet')
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background:
                'rgba(74,158,255,0.12)',
              border:
                '1px solid rgba(74,158,255,0.2)',
              padding: '6px 12px',
              borderRadius: 20,
              cursor: 'pointer',
            }}
          >
            <Coins
              size={14}
              color="#4a9eff"
            />

            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#4a9eff',
              }}
            >
              {user?.coin_balance || 0}
            </span>
          </div>

          <div
            onClick={() =>
              router.push('/notifications')
            }
            style={{
              position: 'relative',
              cursor: 'pointer',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background:
                'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell
              size={18}
              color="#8A9BB0"
            />

            {unreadCount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#F87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {unreadCount > 9
                  ? '9+'
                  : unreadCount}
              </div>
            )}
          </div>

          <div
            onClick={() =>
              router.push('/profile')
            }
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, #4a9eff, #1a3a8f)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt=""
                style={{
                  width: 36,
                  height: 36,
                  objectFit: 'cover',
                }}
              />
            ) : (
              user?.full_name?.[0] || 'U'
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          TABS
      ===================================================== */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 20px 0',
          gap: 8,
        }}
      >
        {['for-you', 'tasks', 'trending'].map(
          t => (
            <button
              key={t}
              onClick={() =>
                handleTabChange(t)
              }
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                background:
                  tab === t
                    ? '#fff'
                    : 'transparent',
                color:
                  tab === t
                    ? '#0A1628'
                    : '#8A9BB0',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t === 'for-you'
                ? 'For You'
                : t === 'tasks'
                ? 'Tasks'
                : 'Trending'}
            </button>
          )
        )}

        {tab === 'tasks' && (
          <div
            onClick={() =>
              setShowFilter(!showFilter)
            }
            style={{
              marginLeft: 'auto',
              cursor: 'pointer',
              width: 34,
              height: 34,
              borderRadius: '50%',
              background:
                'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal
              size={18}
              color={
                showFilter
                  ? '#4a9eff'
                  : '#8A9BB0'
              }
            />
          </div>
        )}
      </div>

      {/* =====================================================
          TASK FILTER
      ===================================================== */}

      {showFilter && tab === 'tasks' && (
        <div
          style={{
            padding: '10px 20px 0',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {[
            'all',
            'follow',
            'watch',
            'share',
            'review',
            'campaign',
          ].map(f => (
            <button
              key={f}
              onClick={() =>
                setTaskFilter(f)
              }
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background:
                  taskFilter === f
                    ? '#4a9eff'
                    : 'rgba(255,255,255,0.06)',
                color:
                  taskFilter === f
                    ? '#fff'
                    : '#8A9BB0',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textTransform:
                  'capitalize',
              }}
            >
              {f === 'all'
                ? 'All Tasks'
                : f}
            </button>
          ))}
        </div>
      )}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div
        style={{
          padding: '16px 20px 0',
        }}
      >
        {/* Carousel */}

        <div
          style={{
            marginBottom: 20,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {CAROUSEL_SLIDES.map(
              (slide, i) => (
                <div
                  key={slide.id}
                  style={{
                    display:
                      i === carouselIndex
                        ? 'block'
                        : 'none',
                  }}
                >
                  {slide.type ===
                  'workflow' ? (
                    <div
                      style={{
                        background: slide.bg,
                        borderRadius: 16,
                        padding:
                          '20px 20px 24px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          color:
                            'rgba(255,255,255,0.6)',
                          marginBottom: 4,
                          letterSpacing: 1,
                          textTransform:
                            'uppercase',
                        }}
                      >
                        Get started
                      </p>

                      <p
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#fff',
                          marginBottom: 20,
                        }}
                      >
                        {slide.title}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'space-between',
                        }}
                      >
                        {slide.steps.map(
                          (
                            step,
                            idx
                          ) => (
                            <div
                              key={step}
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: 6,
                              }}
                            >
                              <div
                                style={{
                                  textAlign:
                                    'center',
                                }}
                              >
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius:
                                      '50%',
                                    background:
                                      'rgba(255,255,255,0.2)',
                                    display:
                                      'flex',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'center',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color:
                                      '#fff',
                                    margin:
                                      '0 auto 6px',
                                  }}
                                >
                                  {idx + 1}
                                </div>

                                <p
                                  style={{
                                    fontSize: 10,
                                    color:
                                      'rgba(255,255,255,0.85)',
                                    margin: 0,
                                    whiteSpace:
                                      'nowrap',
                                    fontWeight:
                                      600,
                                  }}
                                >
                                  {step}
                                </p>
                              </div>

                              {idx <
                                slide.steps
                                  .length -
                                  1 && (
                                <div
                                  style={{
                                    width: 16,
                                    height: 1,
                                    background:
                                      'rgba(255,255,255,0.3)',
                                    marginBottom: 16,
                                  }}
                                />
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        if (
                          slide.action.startsWith(
                            '/'
                          )
                        ) {
                          router.push(
                            slide.action
                          );
                        } else {
                          window.open(
                            slide.action,
                            '_blank'
                          );
                        }
                      }}
                      style={{
                        background:
                          slide.bg,
                        borderRadius: 16,
                        padding:
                          '22px 20px',
                        cursor: 'pointer',
                        minHeight: 110,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color:
                            slide.textColor,
                          marginBottom: 6,
                        }}
                      >
                        {slide.title}
                      </p>

                      <p
                        style={{
                          fontSize: 13,
                          color:
                            slide.textColor,
                          opacity: 0.8,
                          marginBottom: 16,
                          lineHeight: 1.4,
                        }}
                      >
                        {slide.sub}
                      </p>

                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color:
                            slide.textColor,
                          background:
                            'rgba(0,0,0,0.12)',
                          padding:
                            '8px 16px',
                          borderRadius: 20,
                        }}
                      >
                        {slide.cta}
                      </span>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent:
                'center',
              gap: 6,
              marginTop: 10,
            }}
          >
            {CAROUSEL_SLIDES.map(
              (_, i) => (
                <div
                  key={i}
                  onClick={() =>
                    setCarouselIndex(i)
                  }
                  style={{
                    width:
                      i === carouselIndex
                        ? 20
                        : 6,
                    height: 6,
                    borderRadius: 3,
                    background:
                      i === carouselIndex
                        ? '#4a9eff'
                        : 'rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                />
              )
            )}
          </div>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#8A9BB0',
            }}
          >
            Loading feed...
          </div>
        ) : tab === 'tasks' ? (
          filteredTasks.length === 0 ? (
            <Empty
              icon="📋"
              title="No tasks yet"
              sub="Tasks will appear here soon"
            />
          ) : (
            filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                router={router}
              />
            ))
          )
        ) : tab === 'trending' ? (
          tracks.length === 0 ? (
            <Empty
              icon="🔥"
              title="Nothing trending yet"
              sub="Check back soon"
            />
          ) : (
            tracks.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                router={router}
              />
            ))
          )
        ) : (
          <>
            {/* Follow Rewaiq task */}

            <div
              onClick={() =>
                router.push(
                  '/task?id=follow-rewaiq'
                )
              }
              style={{
                background:
                  'linear-gradient(135deg, rgba(74,158,255,0.15), rgba(45,107,228,0.1))',
                border:
                  '1px solid rgba(74,158,255,0.25)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'flex-start',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background:
                        'rgba(74,158,255,0.2)',
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                    }}
                  >
                    <Users
                      size={22}
                      color="#4a9eff"
                    />
                  </div>

                  <div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#fff',
                        margin: 0,
                      }}
                    >
                      Follow Rewaiq
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: '#8A9BB0',
                        margin:
                          '2px 0 0',
                      }}
                    >
                      Follow us on
                      Instagram and
                      earn
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: 4,
                    background:
                      'rgba(74,158,255,0.15)',
                    padding:
                      '4px 10px',
                    borderRadius: 20,
                  }}
                >
                  <Coins
                    size={12}
                    color="#4a9eff"
                  />

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#4a9eff',
                    }}
                  >
                    +50
                  </span>
                </div>
              </div>

              <div
                style={{
                  height: 1,
                  background:
                    'rgba(255,255,255,0.06)',
                  marginBottom: 10,
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: '#8A9BB0',
                  }}
                >
                  Takes 30 seconds
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: '#4a9eff',
                    fontWeight: 600,
                  }}
                >
                  Do this now
                </span>
              </div>
            </div>

            {/* Tracks */}

            {tracks.length === 0 ? (
              <Empty
                icon="🎵"
                title="No tracks yet"
                sub="Artists will upload music soon"
              />
            ) : (
              tracks.map(track => (
                <TrackCard
                  key={track.id}
                  track={track}
                  router={router}
                />
              ))
            )}
          </>
        )}
      </div>

      <InstallPrompt />

      <BottomNav active="home" />
    </div>
  );
}

/* =========================================================
   EMPTY
   ========================================================= */

function Empty({ icon, title, sub }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 0',
        color: '#8A9BB0',
      }}
    >
      <div
        style={{
          fontSize: 44,
          marginBottom: 12,
        }}
      >
        {icon}
      </div>

      <p
        style={{
          fontWeight: 600,
          color: '#fff',
          marginBottom: 4,
        }}
      >
        {title}
      </p>

      <p style={{ fontSize: 13 }}>
        {sub}
      </p>
    </div>
  );
}

/* =========================================================
   TRACK CARD
   ========================================================= */

function TrackCard({ track, router }) {
  return (
    <div
      onClick={() =>
        router.push(
          `/stream?id=${track.id}`
        )
      }
      style={{
        background: '#0D1F3C',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          height: 180,
          background:
            'linear-gradient(135deg, #0D1F3C, #1a3a8f, #0D1F3C)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background:
              'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Play
            size={24}
            color="#fff"
            fill="#fff"
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: '#4a9eff',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Coins
            size={12}
            color="#fff"
          />

          +{track.campaign_coins}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#4a9eff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {track.artist_name?.[0] ||
              'A'}
          </div>

          <span
            style={{
              fontSize: 13,
              color: '#8A9BB0',
            }}
          >
            {track.artist_name ||
              'Artist'}
          </span>

          <span
            style={{
              fontSize: 11,
              color: '#8A9BB0',
              marginLeft: 'auto',
              background:
                'rgba(255,255,255,0.06)',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            {track.content_type}
          </span>
        </div>

        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 4,
          }}
        >
          {track.title}
        </p>

        {track.description && (
          <p
            style={{
              fontSize: 12,
              color: '#8A9BB0',
              lineHeight: 1.5,
            }}
          >
            {track.description.slice(
              0,
              80
            )}
            ...
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TASK CARD
   ========================================================= */

function TaskCard({ task, router }) {
  return (
    <div
      onClick={() =>
        !task.completed &&
        router.push(
          `/task?id=${task.id}`
        )
      }
      style={{
        background: '#0D1F3C',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: task.completed
          ? 'default'
          : 'pointer',
        opacity: task.completed
          ? 0.6
          : 1,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background:
            'rgba(74,158,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {task.completed ? (
          <CheckCircle
            size={24}
            color="#1A7A4A"
          />
        ) : (
          <Circle
            size={24}
            color="#4a9eff"
          />
        )}
      </div>

      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 3,
          }}
        >
          {task.title}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: '#8A9BB0',
              textTransform:
                'capitalize',
            }}
          >
            {task.task_type}
          </span>

          {task.completion_count >
            0 && (
            <span
              style={{
                fontSize: 11,
                color: '#8A9BB0',
              }}
            >
              {task.completion_count}{' '}
              completed
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Coins
          size={14}
          color="#4a9eff"
        />

        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#4a9eff',
          }}
        >
          +{task.reward_coins}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE WRAPPER
   ========================================================= */

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Spinner fullscreen />
      }
    >
      <HomeContent />
    </Suspense>
  );
                  }
