package com.tcet.hms.repositorys;

import com.tcet.hms.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    List<Doctor> findByDepartmentId(Long departmentId);

    List<Doctor> findBySpecializationIgnoreCaseContaining(String specialization);
}
