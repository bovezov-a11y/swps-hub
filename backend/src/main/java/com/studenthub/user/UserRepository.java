package com.studenthub.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByCalendarToken(String calendarToken);

    List<User> findAllByRoleInOrderByDisplayName(Collection<Role> roles);
}
